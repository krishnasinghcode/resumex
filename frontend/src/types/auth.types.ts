export interface User {
  _id:             string;
  email:           string;
  displayName:     string;
  avatar?:         string;
  authProvider:    'local' | 'google';
  isEmailVerified: boolean;
  role:            'user' | 'company';
  createdAt:       string;
  updatedAt:       string;
}

export interface AuthResponse {
  accessToken: string;
  user:        User;
}

export interface RegisterInput {
  email:       string;
  password:    string;
  displayName: string;
}

export interface LoginInput {
  email:    string;
  password: string;
}
