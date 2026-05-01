export interface User {
  id: number;
  username: string;
  email: string;
}
export interface DecodedToken {
  id: number;
  username: string;
  email: string;
  exp: number;
}
export interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}
