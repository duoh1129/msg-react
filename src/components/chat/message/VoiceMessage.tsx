import { IonIcon } from '@ionic/react';
import {
  checkmarkDoneOutline,
  checkmarkOutline,
  eyeOutline,
  pauseCircle,
  playCircle,
} from 'ionicons/icons';
import Parse from 'parse';
import React, { useEffect, useRef, useState } from 'react';
import { getTimeFromSeconds } from 'src/functions/common/getTimeFromSeconds';
import { getVolumeTick } from 'src/functions/chat/getVolumeTick';
import Hammer from 'react-hammerjs';

interface MProps {
  isSingle: boolean | undefined;
  isFromMe: boolean;
  received: boolean;
  selected?: boolean;
  read: boolean;
  opened: boolean;
  showingInfo?: boolean;
  atLeastOneSelectedMessage?: boolean;
  msgHour: string;
  msgMinute: string;
  senderName: string;
  msg: any;
  toggleSelectedMessage?: any;
  setReplyingToMessage?: any;
}

const VoiceMessage: React.FC<MProps> = ({
  isSingle,
  isFromMe,
  received,
  read,
  opened,
  atLeastOneSelectedMessage,
  msgHour,
  msgMinute,
  senderName,
  msg,
  selected,
  toggleSelectedMessage,
  showingInfo,
  setReplyingToMessage,
}) => {
  const [audioPlaying, setAudioPlaying] = useState({
    isPlaying: false,
    messageName: '',
    isPaused: false,
  });
  const [audioPlayingTime, setAudioPlayingTime] = useState(0);
  const voiceMessageMedia = useRef<any>(null); //message Media obj (audio file)
  const voiceMessageMediaTimer = useRef<any>(null); // interval to update the time
  const [moveX, setMoveX] = useState(0);

  let containerStyle = isFromMe
    ? {
        marginRight: `${Math.abs(moveX * 2)}px`,
      }
    : {
        marginLeft: `${Math.abs(moveX * 2)}px`,
      };

  useEffect(() => {
    if (Math.abs(moveX) > 35 && !showingInfo) {
      setReplyingToMessage(msg);
      setMoveX(0);
    }
  }, [moveX]);

  const setAudioPlayed = () => {
    if (!isFromMe) {
      Parse.Cloud.run('setOpenedMessageInfo', {
        messageID: msg.id,
      });
    }
  };

  const playVoiceMessage = async (url: string, name: string) => {
    //the first function of this is the one at the bottom, the others are callbacks
    //@ts-expect-error
    let path = `${cordova.file.dataDirectory}voice-messages/${
      name.split('_')[1]
    }`;

    let isTheSameAudioPlaying =
      `${name.split('_')[1]}` ==
      voiceMessageMedia.current?.src?.split('/')[
        voiceMessageMedia.current?.src?.split('/').length - 1
      ]
        ? true
        : false;

    const fileExists = () => {
      //the file exists, so play the file
      playAudio(path);
    };
    const fileDoesNotExist = () => {
      //file does not exist, download it from the server
      downloadAudioFile();
    };

    const downloadAudioFile = async () => {
      //@ts-ignore
      var dl = new download();

      const DownloaderError = () => {
        alert('There was an error. Try again later.');
      };

      const DownloaderSuccess = () => {
        //the file on parse does not have the same name but is in format XXXXXXX_filename.extension,
        //so we need to remove the first part to get the original name.
        //This is done so that we can play an audio file we have sent without downloading it from the server
        //(because we check if the file exists on memory but we can't predict parse's 'code',
        //so we need to remove it when downloading the audio file and use only the original name)

        //get the fileEntry of the downloaded file, name is Parse's name
        //@ts-expect-error
        window.resolveLocalFileSystemURL(
          //@ts-expect-error
          `${cordova.file.dataDirectory}voice-messages/${name}`,
          (fileEntry: any) => {
            //get the destination directoryEntry (in this case we need to rename the file only so it's the same dir)
            //@ts-expect-error
            window.resolveLocalFileSystemURL(
              //@ts-expect-error
              `${cordova.file.dataDirectory}voice-messages/`,
              (dirEntry: any) => {
                // the renaming is done using the moveTo function (we are moving it to the same directory so it's basically just a rename.)
                const renameSuccess = () => {
                  playAudio(path);
                };
                const renameError = () => {
                  alert('There was an error. Try again later.');
                  fileEntry.remove();
                };

                fileEntry.moveTo(
                  dirEntry,
                  `${name.split('_')[1]}`,
                  renameSuccess,
                  renameError
                );
              }
            );
          }
        );
      };

      dl.Initialize({
        //@ts-expect-error
        fileSystem: cordova.file.dataDirectory,
        folder: 'voice-messages',
        success: DownloaderSuccess,
        error: DownloaderError,
      });

      dl.Get(url);
    };

    setAudioPlayed();

    //look for the file and check if it already exists
    if (isTheSameAudioPlaying) {
      voiceMessageMedia.current?.play();
    } else {
      //if a message is playing first stop it then play the next
      if (voiceMessageMedia.current != null) {
        setAudioPlaying({
          ...audioPlaying,
          messageName: '',
          isPlaying: false,
          isPaused: false,
        });
        voiceMessageMedia.current?.stop();
        voiceMessageMedia.current?.release();
        voiceMessageMedia.current = null;
      }
      //@ts-expect-error
      window.resolveLocalFileSystemURL(path, fileExists, fileDoesNotExist);
    }
  };

  //callback to set status. When it's running we set the name of the file and the state in an useState.
  //The file name is used to identify which audio is playing when rendering.
  const updateAudioMediaStatus = (status: number) => {
    switch (status) {
      case 1:
        //audio starting, set time to 0
        setAudioPlayingTime(0);
        break;
      case 2:
        setAudioPlaying((audioPlaying) => ({
          ...audioPlaying,
          messageName:
            voiceMessageMedia.current.src.split('/')[
              voiceMessageMedia.current.src.split('/').length - 1
            ],
          isPlaying: true,
          isPaused: false,
        }));
        voiceMessageMediaTimer.current = setInterval(() => {
          setAudioPlayingTime((audioPlayingTime) => audioPlayingTime + 1);
        }, 1000);
        break;
      case 3:
        clearInterval(voiceMessageMediaTimer.current);
        setAudioPlaying((audioPlaying) => ({
          ...audioPlaying,
          isPlaying: false,
          isPaused: true,
        }));
        break;
      case 4:
        setAudioPlaying((audioPlaying) => ({
          messageName: '',
          isPlaying: false,
          isPaused: false,
        }));
        setAudioPlayingTime(0);
        voiceMessageMedia.current?.release();
        voiceMessageMedia.current = null;
        clearInterval(voiceMessageMediaTimer.current);
        break;
    }
  };

  const playAudio = async (path: string) => {
    //@ts-expect-error
    voiceMessageMedia.current = new Media(
      path,
      () => {},
      () => {},
      updateAudioMediaStatus
    );
    voiceMessageMedia.current?.setVolume(1.0);
    voiceMessageMedia.current?.play();
  };

  return (
    <>
      {isSingle ? (
        <>
          <div
            className={`${isFromMe ? 'own-msg' : 'diff-msg'} msg audio-msg ${
              selected && 'selected'
            }`}
          >
            {/* show play/pause icon depending on status */}
            {
              //prettier-ignore
              !showingInfo && ((!audioPlaying?.isPlaying &&
                audioPlaying?.messageName !=
                  msg
                    ?.get('attachment')
                    ?.get('file')
                    ?._name.split('_')[1]) ||
              //prettier-ignore
              !(audioPlaying?.messageName ==
                  msg
                    ?.get('attachment')
                    ?.get('file')
                    ?._name?.split('_')[1]) || audioPlaying?.isPaused) ? (
              <IonIcon
                onClick={() => {
                  if(!showingInfo){playVoiceMessage(
                    msg?.get('attachment')?.get('file')?._url,
                    msg?.get('attachment')?.get('file')?._name
                  );}
                }}
                icon={playCircle}
                className="icon"
                
              />
            ) : (
              <>
              {!showingInfo && (<IonIcon
                onClick={() =>voiceMessageMedia.current?.pause()}
                icon={pauseCircle}
                className="icon"
              />)}</>
            )
            }
            <div className="main_container" style={containerStyle}>
              <Hammer
                onPress={() => {
                  if (!showingInfo && !selected && !atLeastOneSelectedMessage) {
                    toggleSelectedMessage(msg);
                  }
                }}
                onTap={() => {
                  if (!showingInfo && atLeastOneSelectedMessage) {
                    toggleSelectedMessage(msg);
                  }
                }}
                onPan={(e) => {
                  if (Math.abs(e.deltaX) < 45 && !showingInfo) {
                    setMoveX(e.deltaX);
                  } else {
                    setMoveX(0);
                  }
                }}
                direction={'DIRECTION_HORIZONTAL'}
              >
                <div>
                  <div className="volume_container">{getVolumeTick()}</div>
                  <div className="info-msg full">
                    <span className="audio_time">
                      {
                        //prettier-ignore
                        ((audioPlaying?.isPlaying || audioPlaying?.isPaused) &&
                                    audioPlaying?.messageName ==
                                      msg
                                        ?.get('attachment')
                                        ?.get('file')
                                        ?._name?.split('_')[1]) ? 
                                      <>
                                        {getTimeFromSeconds(audioPlayingTime)}
                                      </> : <>
                                      {getTimeFromSeconds(
                                        msg
                                          ?.get('attachment')
                                          ?.get('audioDuration')
                                      )}
                                    </>
                      }
                    </span>
                    {`${msg.get('createdAt')?.getHours()}:${msg
                      .get('createdAt')
                      ?.getMinutes()}`}{' '}
                    {isFromMe && (
                      <>
                        {' '}
                        {opened && (
                          <IonIcon
                            style={{ color: '#0087FF' }}
                            icon={eyeOutline}
                          />
                        )}{' '}
                        {!received && !read && (
                          <IonIcon icon={checkmarkOutline} />
                        )}
                        {received && !read && (
                          <IonIcon icon={checkmarkDoneOutline} />
                        )}
                        {read && (
                          <IonIcon
                            style={{ color: '#0087FF' }}
                            icon={checkmarkDoneOutline}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Hammer>
            </div>
          </div>
        </>
      ) : (
        <>
          <div
            className={`${isFromMe ? 'own-msg' : 'diff-msg'} msg audio-msg ${
              selected && 'selected'
            }`}
          >
            <div className="audio-msg-sender">{!isFromMe && senderName}</div>
            <div className="audio-msg-content">
              {/* show play/pause icon depending on status */}
              {
                //prettier-ignore
                ((!audioPlaying?.isPlaying &&
                              audioPlaying?.messageName !=
                                msg
                                  ?.get('attachment')
                                  ?.get('file')
                                  ?._name?.split('_')[1]) ||
                            //prettier-ignore
                            !(audioPlaying?.messageName ==
                                msg
                                  ?.get('attachment')
                                  ?.get('file')
                                  ?._name?.split('_')[1]) || audioPlaying?.isPaused) ? (
                              <IonIcon
                                onClick={() => {
                                  if(!showingInfo){
                                    playVoiceMessage(
                                      msg?.get('attachment')?.get('file')?._url,
                                      msg?.get('attachment')?.get('file')?._name
                                    );
                                  }
                                }}
                                icon={playCircle}
                                className="icon"
                              />
                            ) : (
                              <IonIcon
                                onClick={() => voiceMessageMedia.current?.pause()}
                                icon={pauseCircle}
                                className="icon"
                              />
                            )
              }
              <div className="main_container" style={containerStyle}>
                <Hammer
                  onPress={() => {
                    if (
                      !showingInfo &&
                      !selected &&
                      !atLeastOneSelectedMessage
                    ) {
                      toggleSelectedMessage(msg);
                    }
                  }}
                  onTap={() => {
                    if (!showingInfo && atLeastOneSelectedMessage) {
                      toggleSelectedMessage(msg);
                    }
                  }}
                  onPan={(e) => {
                    if (Math.abs(e.deltaX) < 45 && !showingInfo) {
                      setMoveX(e.deltaX);
                    } else {
                      setMoveX(0);
                    }
                  }}
                  direction={'DIRECTION_HORIZONTAL'}
                >
                  <div>
                    <div className="volume_container">{getVolumeTick()}</div>
                    <div className="info-msg full">
                      <span className="audio_time">
                        {
                          //prettier-ignore
                          ((audioPlaying?.isPlaying || audioPlaying?.isPaused) &&
                                    audioPlaying?.messageName ==
                                      msg
                                        ?.get('attachment')
                                        ?.get('file')
                                        ?._name?.split('_')[1]) ? 
                                      <>
                                        {getTimeFromSeconds(audioPlayingTime)}
                                      </> : <>
                                      {getTimeFromSeconds(
                                        msg
                                          ?.get('attachment')
                                          ?.get('audioDuration')
                                      )}
                                    </>
                        }
                      </span>
                      {`${msg.get('createdAt')?.getHours()}:${msg
                        .get('createdAt')
                        ?.getMinutes()}`}{' '}
                      {isFromMe && (
                        <>
                          {' '}
                          {opened && (
                            <IonIcon
                              style={{ color: '#0087FF' }}
                              icon={eyeOutline}
                            />
                          )}{' '}
                          {!received && !read && (
                            <IonIcon icon={checkmarkOutline} />
                          )}
                          {received && !read && (
                            <IonIcon icon={checkmarkDoneOutline} />
                          )}
                          {read && (
                            <IonIcon
                              style={{ color: '#0087FF' }}
                              icon={checkmarkDoneOutline}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Hammer>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default VoiceMessage;
