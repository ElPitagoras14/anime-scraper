import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const updateDataStatus = async (
  token: string,
  userId: string,
  isAdmin: boolean,
  isActive: boolean
) => {
  const usersOptions = {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: `${BACKEND_URL}/api/v2/users/status/${userId}`,
    data: {
      isAdmin,
      isActive,
    },
  };

  await axios(usersOptions);
};
