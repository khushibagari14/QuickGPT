import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";

axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );
  const [token, setToken] = useState(
    localStorage.getItem("token") || null
  );
  const [loadingUser, setLoadingUser] = useState(true);

  // Fetch logged in user
  const fetchUser = async () => {
    try {
      const { data } = await axios.get("/api/user/data", {
        headers: {
          Authorization: token,
        },
      });

      if (data.success) {
        setUser(data.user);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingUser(false);
    }
  };

  // Create new chat
  const createNewChat = async () => {
    try {
      if (!user) {
        return toast("Login to create a new chat");
      }

      navigate("/");

      const { data } = await axios.post(
        "/api/chat/create",
        {},
        {
          headers: {
            Authorization: token,
          },
        }
      );

      if (!data.success) {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Fetch all chats
  const fetchUserChats = async () => {
    try {
      const { data } = await axios.get("/api/chat/get", {
        headers: {
          Authorization: token,
        },
      });

      if (!data.success) {
        return toast.error(data.message);
      }

      // No chats -> create one
      if (data.chats.length === 0) {
        await createNewChat();

        const { data: newData } = await axios.get("/api/chat/get", {
          headers: {
            Authorization: token,
          },
        });

        if (newData.success) {
          setChats(newData.chats);
          setSelectedChat(newData.chats[0] || null);
        }

        return;
      }

      setChats(data.chats);
      setSelectedChat(data.chats[0]);
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Theme
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme]);

  // Fetch chats whenever user changes
  useEffect(() => {
    if (user) {
      fetchUserChats();
    } else {
      setChats([]);
      setSelectedChat(null);
    }
  }, [user]);

  // Fetch user whenever token changes
  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setUser(null);
      setLoadingUser(false);
    }
  }, [token]);

  const value = {
    navigate,
    user,
    setUser,
    fetchUser,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    theme,
    setTheme,
    createNewChat,
    fetchUserChats,
    loadingUser,
    token,
    setToken,
    axios,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);