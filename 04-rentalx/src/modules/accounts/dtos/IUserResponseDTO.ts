export interface IUserResponseDTO {
  id: string;
  name: string;
  email: string;
  driver_license: string;
  avatar_url: () => string;
}
