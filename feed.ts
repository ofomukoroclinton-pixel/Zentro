export type FeedKind = "home" | "community" | "romance" | "video";

export const FEEDS: Record<FeedKind, {
  title: string;
  subtitle: string;
  videoOnly?: boolean;
  empty: string;
}> = {
  home: {
    title: "Home",
    subtitle: "What’s happening on Zentro",
    empty: "Your home feed is waiting for posts.",
  },
  community: {
    title: "Community",
    subtitle: "Discover conversations and people around shared interests.",
    empty: "No community posts yet.",
  },
  romance: {
    title: "Romance",
    subtitle: "Discover people and connections — with privacy and control.",
    empty: "No profiles to show right now.",
  },
  video: {
    title: "Video",
    subtitle: "Watch Zentro videos.",
    videoOnly: true,
    empty: "No videos yet.",
  },
};
