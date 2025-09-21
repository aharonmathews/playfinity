import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

interface UserData {
  email: string;
  name: string;
  age: number;
  disability: string;
}

interface UserContextType {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  loading: boolean;
  fetchUserData: (email: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Get user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setLoading(false);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (email: string) => {
    try {
      setLoading(true);
      console.log(`🔍 Fetching user data for: ${email}`);

      const userDoc = await getDoc(doc(db, "users", email));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("📦 User data from Firestore:", userData);

        const fullUserData: UserData = {
          email,
          name: userData.name || email.split("@")[0],
          age: userData.age || 14,
          disability: userData.disability || "None",
        };

        setUser(fullUserData);
        localStorage.setItem("currentUser", JSON.stringify(fullUserData));
        console.log("✅ User data loaded successfully:", fullUserData);
      } else {
        console.log("❌ No user document found in Firestore");
        // User document doesn't exist, set defaults
        const defaultUserData: UserData = {
          email,
          name: email.split("@")[0],
          age: 14,
          disability: "None",
        };
        setUser(defaultUserData);
        localStorage.setItem("currentUser", JSON.stringify(defaultUserData));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Set fallback data
      const fallbackUserData: UserData = {
        email,
        name: email.split("@")[0],
        age: 14,
        disability: "None",
      };
      setUser(fallbackUserData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, fetchUserData }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
