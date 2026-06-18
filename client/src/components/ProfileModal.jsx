import {
  useEffect,
  useState,
} from "react";

import api
from "../services/api";

import {
  useAuth
}
from "../context/AuthContext";

function ProfileModal({

  showProfile,

  setShowProfile,

}) {

  const {
    token,
  } =
    useAuth();

  const [username,
    setUsername] =
    useState("");

  const [email,
    setEmail] =
    useState("");

  const [avatar,
    setAvatar] =
    useState("");

  useEffect(()=>{

    if (
      !showProfile
    )
      return;

    const fetchProfile =
      async ()=>{

        try {

          const response =
            await api.get(
              "/users/profile",

              {

                headers:{

                  Authorization:
                    `Bearer ${token}`,

                },

              }
            );

          setUsername(
            response.data
              .username
          );

          setEmail(
            response.data
              .email
          );

          setAvatar(
            response.data
              .avatar
          );

        } catch(error){

          console.log(
            error
          );

        }

      };

    fetchProfile();

  }, [
    showProfile
  ]);

  const updateProfile =
    async ()=>{

      try {

        await api.put(

          "/users/profile",

          {

            username,

            avatar,

          },

          {

            headers:{

              Authorization:
                `Bearer ${token}`,

            },

          }
        );

        alert(
          "Profile Updated ✅"
        );

        setShowProfile(
          false
        );

      } catch(error){

        console.log(
          error
        );

      }

    };

  if (
    !showProfile
  )
    return null;

  return (

    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">

      <div className="w-96 rounded-2xl bg-zinc-900 p-6">

        <h2 className="mb-4 text-2xl font-bold">

          Profile

        </h2>

        <input
          type="text"
          placeholder="Username"

          value={
            username
          }

          onChange={(e)=>

            setUsername(
              e.target.value
            )

          }

          className="mb-4 w-full rounded-lg bg-zinc-800 p-3"
        />

        <input
  type="file"

  accept="image/*"

  onChange={
    async (e)=>{

      const file =
        e.target.files[0];

      if (!file)
        return;

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      try {

        const response =
          await api.post(

            "/upload",

            formData,

            {

              headers:{

                Authorization:
                  `Bearer ${token}`,

                "Content-Type":
                  "multipart/form-data",

              },

            }

          );

        setAvatar(

          response.data
            .fileUrl

        );

      } catch(error){

        console.log(
          error
        );

      }

    }
  }

  className="mb-4 w-full"
/>

{avatar && (

  <img
    src={avatar}

    alt="avatar"

    className="mb-4 h-24 w-24 rounded-full object-cover border border-zinc-700"
  />

)}


        <input
          type="text"

          disabled

          value={
            email
          }

          className="mb-4 w-full rounded-lg bg-zinc-800 p-3 opacity-60"
        />

        <button
          onClick={
            updateProfile
          }
          className="w-full rounded-lg bg-blue-600 p-3 hover:bg-blue-700"
        >

          Save Changes

        </button>

      </div>

    </div>

  );

}

export default
  ProfileModal;