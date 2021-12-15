import { IonButton, IonContent, IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonLabel, IonList, IonPage, IonSkeletonText, IonTitle, IonToolbar } from '@ionic/react'
import { CircularProgress } from '@material-ui/core';
import { arrowBackOutline, arrowUndoOutline, chevronBackOutline } from 'ionicons/icons';
import React, { useEffect, useState } from 'react'
import Parse from 'parse';
import 'src/assets/sass/messagenius/pages/chat/ScheduledMessagesList.scss';

interface SProps {
    convId: string;
    closeScheduledMessagesList: any;
}

const ScheduledMessagesList: React.FC<SProps> = ({ convId, closeScheduledMessagesList }) => {
    
    // query complete
    const [queryComplete,setQueryComplete] = useState<boolean>(false);
    const [loadingScreen, setLoadingScreen] = useState<boolean>(false);
    const [scheduledMessages,setScheduledMessages] = useState<Parse.Object<Parse.Attributes>[]>([]);

    useEffect(() => {
        const queryScheduledMessagesList = async () => {
            let query = new Parse.Query('ScheduledMessage');
            query.equalTo('conversation', convId);
            await query.find().then((res) => {
                setScheduledMessages(res);
                setQueryComplete(true);
            })
        }
        queryScheduledMessagesList();
    }, [convId])

    const deleteScheduledMessage = async (message: Parse.Object<Parse.Attributes>) => {
        setLoadingScreen(true);
        await message.destroy().then(() => {
            // remove from local list
            let scheduledMessagesArr = [...scheduledMessages]
            let index = scheduledMessages.findIndex(msg => msg.id = message.id);
            let del = scheduledMessagesArr.splice(index,1)
            setScheduledMessages(scheduledMessagesArr)
            setLoadingScreen(false);
        }).catch(err => {
            alert('There was an error, please try again');
            setLoadingScreen(false);
        })
    }

    return (
        <IonPage className="scheduled-messages-page">
            <IonHeader>
                <IonToolbar className="scheduled-messages-toolbar">
                    <IonTitle>Scheduled Messages</IonTitle>
                    <IonIcon onClick={() => {if(!loadingScreen) closeScheduledMessagesList()}} icon={arrowBackOutline} className="icon scheduled-messages-back-icon"/>
                </IonToolbar>
            </IonHeader>
            <IonContent className="scheduled-messages-container">
                {!queryComplete &&
                <>
                <IonList>
                {Array.from({length: 7}, (() => 0)).map(x => {
                    return (
                        <IonItem>
                        <IonLabel>
                        <IonSkeletonText animated style={{ width: `${Math.round(Math.random() * 99) + 15}%`, height: '25%'}} />
                        <IonSkeletonText animated style={{ width: `${Math.round(Math.random() * 99) + 1}%`, height: '25%' }} />
                        <IonSkeletonText animated style={{ width: `${Math.round(Math.random() * 99) + 1}%`, height: '25%' }} />
                        </IonLabel>
                        </IonItem>
                    )
                })}
                </IonList>
            </>
            }
            {queryComplete && 
            <>
            <IonList>
                {scheduledMessages.map((msg, key) => {

                    return (
                    <IonItemSliding key={key}>
                        <IonItem>
                            <IonLabel className="scheduled-message-time">
                                Scheduled: {new Date(msg.get('scheduledAt')).toLocaleString()}
                            <p className="scheduled-message-text">
                                Message: {msg.get('message')}
                            </p>
                            </IonLabel>
                            <IonIcon style={{color: '#505050'}} slot='end' icon={chevronBackOutline} />
                            <IonIcon style={{color: '#505050', marginLeft: '-25px'}} slot='end' icon={chevronBackOutline} />
                            <IonIcon style={{color: '#505050', marginLeft: '-25px'}} slot='end' icon={chevronBackOutline} />
                            
                        </IonItem>
                        <IonItemOptions side="end">
                            <IonItemOption color="danger" onClick={() => deleteScheduledMessage(msg)}>DELETE</IonItemOption>
                        </IonItemOptions>
                    </IonItemSliding>)
                })}
                {scheduledMessages.length == 0 && 
                <>
                    <div className="no-scheduled-messages-message">
                        <h4>There are no scheduled messages. Schedule one now in the attachment menu!</h4>
                    </div>
                </>
                }
                </IonList>
            </>
            }
            {loadingScreen && 
            <div className="scheduled-messages-loading-container">
                <CircularProgress style={{color: 'cyan', marginBottom: '20px'}}/>
                Deleting, please wait...
            </div>}
            </IonContent>
        
        </IonPage>
    )
}

export default ScheduledMessagesList
