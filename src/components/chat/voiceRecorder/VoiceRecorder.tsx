import { IonIcon } from '@ionic/react';
import { micOutline } from 'ionicons/icons';
import React, { useRef, useState } from 'react';
import { sendMessage } from 'src/functions/chat/sendMessage';
import Parse from 'parse';
import store from 'src/services/redux/store';
import 'src/assets/sass/messagenius/components/chat/VoiceRecorder.scss';
import TimeCounter from './TimeCounter';

const VoiceRecorder = (props: any) => {
  const messageDate = useRef<any>(null);
  const messageName = useRef<any>(null);
  const messagePath = useRef<any>(null);
  const messageMedia = useRef<any>(null);

  const startPosition = useRef<number>(0);
  const didCancel = useRef<boolean>(false);

  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);

  //record a voice message
  const startRecording = async () => {
    messageDate.current = new Date(); //date of the msg
    messageName.current = `recording-${messageDate.current?.getTime()}`; //name of the msg
    //@ts-ignore
    messagePath.current = `${cordova.file.dataDirectory}voice-messages/${messageName.current}.mpga`; //path of the msg (data directory)
    //@ts-ignore
    messageMedia.current = new Media(messagePath.current); //media obj

    messageMedia.current.startRecord(); //start the recording
    setIsRecordingAudio(true);
  };

  const stopRecording = async () => {
    setIsRecordingAudio(false);
    messageMedia.current.stopRecord(); //stop the recording

    messageMedia.current.seekTo(1);
    messageMedia.current.pause();

    setTimeout(() => {
      // @ts-ignore
      window.resolveLocalFileSystemURL(
        messageMedia.current?.src,
        (fileEntry: any) => {
          //read the file
          fileEntry.file(function (file: any) {
            var reader = new FileReader();
            //once read and got the base64 create a parse file and send it
            reader.onloadend = async function () {
              let parseFile = new Parse.File(messageName.current, {
                //@ts-expect-error
                base64: reader.result,
              });

              let messageDuration = Math.floor(
                messageMedia.current?.getDuration()
              );
              messageMedia.current.stop();
              messageMedia.current.release();

              let messageToSend = {
                audio: parseFile,
                audioDuration: messageDuration,
              };
              await sendMessage(
                Parse.User.current()?.id,
                props.convId,
                messageToSend,
                props.messageToReplyTo
              );
            };
            reader.readAsDataURL(file);
          });
        }
      );
    }, 500);
  };

  const cancelRecording = () => {
    setIsRecordingAudio(false);
    navigator.vibrate(40);
    messageMedia.current.stopRecord(); //stop the recording
    messageMedia.current.release(); //release
    startPosition.current = 0; // reset start position
  };

  // on touch start registers the first touch position, whenever a move event happens, it checks the distance of the touch from the start. If it's greater than 100px, it will cancel the recording.
  const checkAudioCanceled = (position: number) => {
    let distanceAbsolute = Math.abs(position - startPosition.current);
    if (distanceAbsolute > 100) {
      // cancel the audio recording
      didCancel.current = true;
      cancelRecording();
    }
  };

  return (
    <>
      {props.type == 'chat' ? (
        <div
          className={`voicerecorder-container-chat ${
            isRecordingAudio && 'isRecording'
          }`}
          onTouchMove={(e) => {
            checkAudioCanceled(e.touches[0].clientX);
          }}
        >
          <IonIcon
            onTouchStart={(e) => {
              startPosition.current = e.touches[0].clientX;
              startRecording();
            }}
            onTouchEnd={() => {
              if (!didCancel.current) {
                stopRecording();
              } else {
                // reset cancel
                didCancel.current = false;
              }
            }}
            className={`voicerecorder-mic-icon ${
              isRecordingAudio && 'isRecording'
            }`}
            icon={micOutline}
          />
          {isRecordingAudio && (
            <div className="voicerecorder-cancel-chat">
              <div style={{ fontSize: '30px', fontWeight: 100 }}>{'<<<'}</div>
              <div style={{ textAlign: 'center', width: '70px' }}>
                Swipe to cancel
              </div>
            </div>
          )}
          {isRecordingAudio && (
            <div className={`voicerecorder-counter-chat`}>
              <TimeCounter />
            </div>
          )}
        </div>
      ) : (
        <div
          className={`voicerecorder-container-chatlist ${
            isRecordingAudio && 'isRecording'
          }`}
          onTouchMove={(e) => {
            checkAudioCanceled(e.touches[0].clientX);
          }}
        >
          <IonIcon
            onTouchStart={(e) => {
              startPosition.current = e.touches[0].clientX;
              startRecording();
            }}
            onTouchEnd={() => {
              if (!didCancel.current) {
                stopRecording();
              } else {
                // reset cancel
                didCancel.current = false;
              }
            }}
            className={`voicerecorder-mic-icon-chatlist ${
              isRecordingAudio && 'isRecording'
            }`}
            icon={micOutline}
          />
          {isRecordingAudio && (
            <div className="voicerecorder-cancel-chatlist">
              <div style={{ fontSize: '30px', fontWeight: 100 }}>{'<<<'}</div>
              <div style={{ textAlign: 'center', width: '70px' }}>
                Swipe to cancel
              </div>
            </div>
          )}
          {isRecordingAudio && (
            <div className={`voicerecorder-counter-chatlist`}>
              <TimeCounter />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default VoiceRecorder;
