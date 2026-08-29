// Shared navigation state carried from search result cards into detail screens,
// so a detail page can show "back to your search" context.
export type SearchNavState = {
  searchQuery?: string;
  searchFilter?: string;
};

declare module "@tanstack/react-router" {
  interface HistoryState extends SearchNavState {}
}
