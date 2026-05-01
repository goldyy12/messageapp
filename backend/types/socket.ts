export interface clientToServer {
  joinUser: (userId: string) => void;
}

export interface serverToClient {
  newMessage: (message: Message) => void;
  privateMessage: (message: PrivateMessage) => void;
}

export interface SocketData {
  userId: string;
}

export interface Message {
  id: number;
  text: string | null;
  senderId: number;
  groupId: number;
  fileUrl: string | null;
  createdAt: Date;
  sender: {
    id: number;
    username: string;
  };
}
export interface PrivateMessage {
  id: number;
  text: string | null;
  senderId: number;
  recipientId: number;
  fileUrl: string | null;
  createdAt: Date;
}
