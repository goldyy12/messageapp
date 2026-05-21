export interface Friend {
  id: number;
  username: string;
}
export interface Message {
  id: number;
  senderId: number;
  recipientId: number;
  sender: Friend;
  receiver: Friend;
  text?: string;
  fileUrl?: string;
  createdAt: string;
}
export interface Group {
  id: number;
  name: string;
  members: Friend[];
}
