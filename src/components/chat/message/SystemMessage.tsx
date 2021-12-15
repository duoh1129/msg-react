import React from 'react';
import 'src/assets/sass/messagenius/components/chat/message/SystemMessage.scss';

interface SProps {
  message: string;
}

const SystemMessage: React.FC<SProps> = ({ message }) => {
  return <div className="system__message">{message}</div>;
};

export default SystemMessage;
