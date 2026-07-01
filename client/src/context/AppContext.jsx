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

    const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [loading, setLoadingUser] = useState(true);

    // Fetch User
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
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setLoadingUser(false);
        }
    };

    // Create New Chat
    const createNewChat = async () => {
        try {
            if (!user) {
                return toast("Login to create a new chat");
            }

            navigate("/");

           await axios.get("/api/chat/create", {
                headers: {
                    Authorization: token,
                },
            });

            await fetchUserChats();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Fetch User Chats
    const fetchUserChats = async () => {
        try {
            const { data } = await axios.get("/api/chat/get", {
                headers: {
                    Authorization: token,
                },
            });

            if (data.success) {
                setChats(data.chats);

                if (data.chats.length === 0) {
                    await createNewChat();
                    return;
                }

                setSelectedChat(data.chats[0]);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
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

    // User Changes
    useEffect(() => {
        if (user) {
            fetchUserChats();
        } else {
            setChats([]);
            setSelectedChat(null);
        }
    }, [user]);

    // Token Changes
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
        loading,
        fetchUserChats,
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