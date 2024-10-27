import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useSearch = ({
  query,
  type,
  disabled
}: {
  query: string;
  type: "artist" | "playlist";
  disabled?: boolean;
}) => {
  const queryFn = async () => {
    const response = await axios.get<SpotifyItem[]>("/api/search", {
      params: { query, type }
    });
    return response.data;
  };
  return useQuery({
    queryKey: ["search", query, type],
    enabled: !!query && !disabled,
    queryFn
  });
};
