import { lazy } from "react";
import {
  AccountCircle,
  AdminPanelSettings,
  EmojiEvents,
  Home,
  Image,
  ImageSearch,
  Info,
  Login,
  Map,
  Paid,
  PersonAdd,
  PestControlRodent,
  Redeem,
  School,
  Settings,
  Storefront,
} from "@mui/icons-material";
import * as zod from "zod";
import { UserAccessLevel } from "../api/services/user/types";
import { itemFilter } from "../api/services/item/types";
import { monsterFilter, mvpFilter } from "../api/services/monster/types";
import { mapInfoFilter } from "../api/services/map/types";
import { vendorItemFilter } from "../api/services/vendor/types";
import { skillFilter } from "../api/services/skill/types";
import { Redirect } from "../lib/tsr/react/Redirect";
import { zodLiteralString } from "../lib/zod/zodLiteralString";
import { RouteLocation } from "../lib/tsr/types";
import { requireAuth } from "./util/requireAuth";
import { requireSettings } from "./util/requireSettings";
import { t } from "./tsr";
import { mapViewRoute } from "./pages/MapViewPage/route";

export const router = t.router({
  home: t.route
    .path("", { exact: true })
    .renderer(lazy(() => import("./pages/HomePage")))
    .meta({ title: "Home", icon: <Home /> }),
  user: t.route
    .path("user", { exact: true })
    .renderer(() => <Redirect to={routes.user.settings({})} />)
    .children({
      settings: t.route
        .path("settings")
        .renderer(lazy(() => import("./pages/UserSettingsPage")))
        .meta({ title: "Settings", icon: <AccountCircle /> })
        .use(requireAuth(UserAccessLevel.User)),
      login: t.route
        .path("login/:destination?")
        .params({ destination: zodLiteralString<RouteLocation>().optional() })
        .renderer(lazy(() => import("./pages/LoginPage")))
        .meta({ title: "Sign in", icon: <Login /> }),
      register: t.route
        .path("register")
        .renderer(lazy(() => import("./pages/RegisterPage")))
        .meta({ title: "Register", icon: <PersonAdd /> }),
    }),
  item: t.route
    .path("item", { exact: true })
    .renderer(() => <Redirect to={routes.item.search({})} />)
    .meta({ title: "Items", icon: <Redeem /> })
    .children({
      search: t.route
        .path("search/:filter?")
        .params({ filter: itemFilter.type.optional() })
        .renderer(lazy(() => import("./pages/ItemSearchPage"))),
      view: t.route
        .path("view/:id")
        .params({ id: zod.number() })
        .renderer(lazy(() => import("./pages/ItemViewPage"))),
    }),
  skill: t.route
    .path("skill", { exact: true })
    .renderer(() => <Redirect to={routes.skill.search({})} />)
    .meta({ title: "Skills", icon: <School /> })
    .children({
      search: t.route
        .path("search/:filter?")
        .params({ filter: skillFilter.type.optional() })
        .renderer(lazy(() => import("./pages/SkillSearchPage"))),
      view: t.route
        .path("view/:id")
        .params({ id: zod.number() })
        .renderer(lazy(() => import("./pages/SkillViewPage"))),
    }),
  shop: t.route
    .path("shop/view/:id")
    .params({ id: zod.string() })
    .renderer(lazy(() => import("./pages/ShopViewPage"))),
  mvp: t.route
    .path("mvp/:filter?")
    .params({ filter: mvpFilter.type.optional() })
    .renderer(lazy(() => import("./pages/MvpSearchPage")))
    .meta({ title: "Mvps", icon: <EmojiEvents /> }),
  monster: t.route
    .path("monster", { exact: true })
    .renderer(() => <Redirect to={routes.monster.search({})} />)
    .meta({ title: "Monsters", icon: <PestControlRodent /> })
    .children({
      search: t.route
        .path("search/:filter?")
        .params({ filter: monsterFilter.type.optional() })
        .renderer(lazy(() => import("./pages/MonsterSearchPage"))),
      view: t.route
        .path("view/:id/:tab")
        .params({
          id: zod.number(),
          tab: zod.enum(["spawns", "drops"]).default("spawns"),
        })
        .renderer(lazy(() => import("./pages/MonsterViewPage"))),
    }),
  map: t.route
    .path("map", { exact: true })
    .renderer(() => <Redirect to={routes.map.search({})} />)
    .meta({ title: "Maps", icon: <Map /> })
    .children({
      search: t.route
        .path("search/:filter?")
        .params({ filter: mapInfoFilter.type.optional() })
        .renderer(lazy(() => import("./pages/MapSearchPage"))),
      view: mapViewRoute,
    }),
  vendor: t.route
    .path("vending/:filter?")
    .params({ filter: vendorItemFilter.type.optional() })
    .renderer(lazy(() => import("./pages/VendorItemSearchPage")))
    .meta({ title: "Vendings", icon: <Storefront /> }),
  donation: t.route
    .path("donation")
    .renderer(lazy(() => import("./pages/DonationsPage")))
    .meta({ title: "Donations", icon: <Paid /> })
    .use(requireSettings((settings) => settings.donations.enabled))
    .children({
      items: t.route
        .path("items/:filter?")
        .params({ filter: itemFilter.type.optional() })
        .renderer(lazy(() => import("./pages/DonationItemsPage"))),
    }),
  serverInfo: t.route
    .path("server-info")
    .renderer(lazy(() => import("./pages/ServerInfoPage")))
    .meta({ title: "Server Info", icon: <Info /> }),
  tools: t.route
    .path("tools")
    .meta({ title: "Tools" })
    .children({
      hunt: t.route.path("hunt").children({
        list: t.route
          .path("", { exact: true })
          .meta({ title: "Hunt", icon: <ImageSearch /> })
          .renderer(lazy(() => import("./pages/HuntToolPage/HuntListPage"))),
        view: t.route
          .path("view")
          .renderer(
            lazy(() => import("./pages/HuntToolPage/View/ViewHuntPage"))
          ),
      }),
    }),
  admin: t.route
    .path("admin", { exact: true })
    .renderer(() => <Redirect to={routes.admin.settings({})} />)
    .meta({ title: "Admin", icon: <AdminPanelSettings /> })
    .use(requireAuth(UserAccessLevel.Admin))
    .children({
      settings: t.route
        .path("settings")
        .renderer(lazy(() => import("./pages/AdminSettingsPage")))
        .meta({ title: "Settings", icon: <Settings /> }),
      assets: t.route
        .path("assets")
        .renderer(lazy(() => import("./pages/AdminAssetsPage")))
        .meta({ title: "Assets", icon: <Image /> }),
    }),
  notFound: t.route
    .path("")
    .renderer(lazy(() => import("./pages/NotFoundPage"))),
});

export const routes = router.routes;

export const logoutRedirect = routes.user.login({});
export const loginRedirect = routes.user({});
