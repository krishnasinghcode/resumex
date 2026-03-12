export interface UpdateProfileInput {
  displayName?: string;
  avatar?:      string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword:     string;
}

export interface DeleteAccountInput {
  password: string;
}
