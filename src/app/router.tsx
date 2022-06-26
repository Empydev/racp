import {
  OptionsRouter,
  RouteMiddleware,
  Redirect,
  stringParser,
} from "react-typesafe-routes";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { AdminPage } from "./pages/AdminPage";
import { AdminConfigPage } from "./pages/AdminConfigPage";
import { AdminConfigEditPage } from "./pages/AdminConfigEditPage";
import { useAppSelector } from "./store";
import { selectIsAuthenticated } from "./slices/auth";

const AuthMiddleware: RouteMiddleware = (next) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  return isAuthenticated ? next : () => <Redirect to={router.login()} />;
};

export const router = OptionsRouter({}, (route) => ({
  home: route("", { component: HomePage, exact: true }),
  login: route("login", { component: LoginPage }),
  admin: route(
    "admin",
    { component: AdminPage, middleware: AuthMiddleware },
    (route) => ({
      config: route("config", { component: AdminConfigPage }, (route) => ({
        edit: route("edit/&:configName", {
          component: AdminConfigEditPage,
          params: { configName: stringParser },
        }),
      })),
    })
  ),
}));
