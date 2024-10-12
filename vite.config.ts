import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_ZK_LOGIN_CLIENT_ID': JSON.stringify(env.VITE_ZK_LOGIN_CLIENT_ID),
      'import.meta.env.VITE_ZK_LOGIN_REDIRECT_URL': JSON.stringify(env.VITE_ZK_LOGIN_REDIRECT_URL),
    },
  };
});
