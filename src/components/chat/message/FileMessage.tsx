import { IonIcon } from '@ionic/react';
import {
  arrowDownCircleOutline,
  arrowRedoCircleOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  closeCircleOutline,
  documentOutline,
  eyeOutline,
  pencil,
} from 'ionicons/icons';
import React, { useEffect, useState } from 'react';
import Parse from 'parse';
import Hammer from 'react-hammerjs';

import 'src/assets/sass/messagenius/components/chat/message/FileMessage.scss';
import QuotedMessage from './quotedMessage/QuotedMessage';

interface FProps {
  msg: Parse.Object<Parse.Attributes>;
  parseFileName: string;
  parseFileURL: string;
  fileExtension: string;
  senderName: string;
  msgHour: any;
  msgMinute: any;
  isSingle: boolean | undefined;
  isFromMe: boolean;
  received: boolean;
  read: boolean;
  opened: boolean;
  selected?: boolean;
  showingInfo?: boolean;
  atLeastOneSelectedMessage?: boolean;
  toggleSelectedMessage?: any;
  setReplyingToMessage?: any;
  quotedMessage?: Parse.Object<Parse.Attributes> | undefined;
}

const FileMessage: React.FC<FProps> = ({
  msg,
  parseFileName,
  parseFileURL,
  fileExtension,
  senderName,
  isSingle,
  msgHour,
  msgMinute,
  isFromMe,
  received,
  read,
  opened,
  selected,
  toggleSelectedMessage,
  showingInfo,
  atLeastOneSelectedMessage,
  setReplyingToMessage,
  quotedMessage,
}) => {
  // The parse file name (XXXXXXX_filename.ext) is used to save the file on the device,
  // so that multiple files with the same name can be downloaded and won't create problems.
  // Path is externalDataDirectory so that other apps can access it

  //@ts-expect-error
  let filePath = `${cordova.file.externalDataDirectory}files/${parseFileName}`;

  // useStates
  const [downloadState, setDownloadState] = useState<number>(0); //0: to download 1: downloading 2: already downloaded
  const [moveX, setMoveX] = useState(0);

  let containerStyle = isFromMe
    ? {
        marginRight: `${Math.abs(moveX * 2)}px`,
      }
    : {
        marginLeft: `${Math.abs(moveX * 2)}px`,
      };

  // useEffects
  //check if the file is already in memory and show the appropriate button
  useEffect(() => {
    getFileState();
  }, []);
  useEffect(() => {
    if (Math.abs(moveX) > 35) {
      setReplyingToMessage(msg);
      setMoveX(0);
    }
  }, [moveX]);

  //functions

  const setFileOpened = () => {
    if (!isFromMe) {
      Parse.Cloud.run('setOpenedMessageInfo', {
        messageID: msg.id,
      });
    }
  };

  // Check if the file exists
  const getFileState = async () => {
    const fileExists = () => {
      //already present
      setDownloadState(2);
    };

    const fileDoesNotExist = () => {
      //need to download
      setDownloadState(0);
    };

    //@ts-expect-error
    window.resolveLocalFileSystemURL(filePath, fileExists, fileDoesNotExist);
  };

  // Download File
  const downloadFile = async () => {
    //@ts-ignore
    let dl = new download();

    const DownloaderError = () => {
      alert('There was an error. Try again later.');
    };

    const DownloaderSuccess = () => {
      setDownloadState(2);
    };

    dl.Initialize({
      //@ts-expect-error
      fileSystem: cordova.file.externalDataDirectory,
      folder: 'files',
      success: DownloaderSuccess,
      error: DownloaderError,
    });

    setDownloadState(1);
    dl.Get(parseFileURL);
  };

  // Open the file
  const openFile = async () => {
    setFileOpened();

    let MIMEtype = '';

    //get the MIME type of the file
    //@ts-expect-error
    window.resolveLocalFileSystemURL(
      filePath,
      (fileEntry: any) => {
        fileEntry.file((success: any) => {
          MIMEtype = success.type;
        });
      },
      () => {
        alert('There was an error. Try again later.');
      }
    );

    //@ts-expect-error
    cordova.plugins.fileOpener2.open(filePath, MIMEtype);
  };

  return (
    <>
      <div
        className={`${isFromMe ? 'own-msg' : 'diff-msg'} msg ${
          selected && 'selected'
        }`}
        style={containerStyle}
      >
        <div className="file-message">
          {!isFromMe && !isSingle && (
            <div
              style={{
                marginLeft: '-10px',
                marginTop: '-5px',
              }}
              className="sender-name"
            >
              {senderName}
            </div>
          )}
          <Hammer
            onPress={() => {
              if (!showingInfo && !selected && !atLeastOneSelectedMessage) {
                toggleSelectedMessage(msg);
              }
            }}
            onTap={() => {
              if (!showingInfo && atLeastOneSelectedMessage) {
                // adding a 10ms timeout so that it won't open the picture (selectedmessages = 0 will happen after the click is registered by the button to open the picture)
                setTimeout(() => {
                  toggleSelectedMessage(msg);
                }, 10);
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
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {quotedMessage && <QuotedMessage message={quotedMessage} />}

              <div className="file-message">
                <div className="chat-document-icon-container">
                  <div className="chat-document-icon">
                    <IonIcon icon={documentOutline} />
                    <h3 className="chat-document-extension">
                      {fileExtension?.toUpperCase()}
                    </h3>
                  </div>
                </div>
                {parseFileName
                  ?.substr(parseFileName?.indexOf('_') + 1)
                  .substr(0, 35)}
                {/* show dots */}
                {parseFileName?.substr(parseFileName?.indexOf('_') + 1)[36] &&
                  '...'}

                <div className="file-message-info-download">
                  {/* to download */}
                  {downloadState == 0 && (
                    <IonIcon
                      onClick={() => {
                        if (!showingInfo && !atLeastOneSelectedMessage) {
                          downloadFile();
                        }
                      }}
                      className="file-message-download-icon"
                      icon={arrowDownCircleOutline}
                    />
                  )}
                  {/* downloading, cancel button */}
                  {downloadState == 1 && (
                    <IonIcon
                      className="file-message-download-icon"
                      icon={closeCircleOutline}
                    />
                  )}
                  {/* downloaded, open button */}
                  {downloadState == 2 && (
                    <IonIcon
                      onClick={() => {
                        if (!showingInfo && !atLeastOneSelectedMessage) {
                          openFile();
                        }
                      }}
                      className="file-message-download-icon"
                      icon={arrowRedoCircleOutline}
                    />
                  )}
                  <div className="info-msg">
                    {`${msgHour}:${msgMinute}`}{' '}
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
              </div>
            </div>
          </Hammer>
        </div>
      </div>
    </>
  );
};

export default FileMessage;
