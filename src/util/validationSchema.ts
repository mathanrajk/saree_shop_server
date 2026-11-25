import * as yup from "yup";

export const CreateUserScheme = yup.object().shape({
  firebaseUid: yup.string().required("Firebase UID is missing!"),
  name: yup.string().trim().required("Name is missing!").min(3, "Name is too short!").max(30, "Name is too long!"),
  email: yup.string().required("Email is missing!").email("Invalid email id!"),
  emailVerified: yup.boolean().optional(),
  photoURL: yup.string().optional(),
});
