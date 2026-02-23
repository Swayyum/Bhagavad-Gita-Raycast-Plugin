import {
  List,
  Icon,
  getPreferenceValues,
  Color,
  ActionPanel,
  Action,
  Toast,
  showToast,
} from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState } from "react";
import fetch from "node-fetch";

interface Preferences {
  colorScheme: "blue" | "green" | "purple" | "orange" | "red";
  showSanskrit: boolean;
  apiSource: "vedic" | "gita";
  apiKey?: string;
}

interface Chapter {
  chapter_number: number;
  name?: string;
  name_meaning?: string;
  verses_count: number;
  summary?: {
    en: string;
    hi: string;
  };
}

interface Verse {
  chapter: number;
  verse: number;
  sanskrit: string;
  translation: string;
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const colorScheme = preferences.colorScheme;
  const isVedic = preferences.apiSource === "vedic";

  const getThemeColor = (scheme: string) => {
    switch (scheme) {
      case "red":
        return Color.Red;
      case "green":
        return Color.Green;
      case "orange":
        return Color.Orange;
      case "purple":
        return Color.Purple;
      case "blue":
      default:
        return Color.Blue;
    }
  };

  const themeColor = getThemeColor(colorScheme);

  // Headers for the RapidAPI option
  const apiHeaders: Record<string, string> = isVedic
    ? {}
    : {
      "X-RapidAPI-Key": preferences.apiKey || "",
      "X-RapidAPI-Host": "bhagavad-gita3.p.rapidapi.com",
    };

  const options = {
    headers: apiHeaders,
  };

  const url = isVedic
    ? "https://vedicscriptures.github.io/chapters"
    : "https://bhagavad-gita3.p.rapidapi.com/v2/chapters/?limit=18";

  const { isLoading, data, error } = useFetch<any>(url, {
    ...options,
    execute: isVedic || !!preferences.apiKey,
    onError: (err) => {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to fetch chapters",
        message: err.message,
      });
    },
  });

  if (error) {
    return (
      <List>
        <List.EmptyView
          title="Error fetching data. Check preferences!"
          icon={Icon.ExclamationMark}
        />
      </List>
    );
  }

  let chapters: Chapter[] = [];
  if (data) {
    chapters = isVedic ? data : data; // The Vedic API returns an array directly.
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search chapters...">
      {chapters.map((ch: any) => {
        const title = isVedic
          ? `Chapter ${ch.chapter_number}: ${ch.name}`
          : `Chapter ${ch.chapter_number}: ${ch.name_meaning}`;

        return (
          <List.Item
            key={ch.chapter_number}
            title={title}
            subtitle={`${ch.verses_count} Verses`}
            icon={{ source: Icon.Book, tintColor: themeColor }}
            actions={
              <ActionPanel>
                <Action.Push
                  title="View Verses"
                  target={
                    <VersesList
                      chapterNumber={ch.chapter_number}
                      versesCount={ch.verses_count}
                    />
                  }
                />
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}

function VersesList({
  chapterNumber,
  versesCount,
}: {
  chapterNumber: number;
  versesCount: number;
}) {
  const preferences = getPreferenceValues<Preferences>();
  const isVedic = preferences.apiSource === "vedic";
  const [verses, setVerses] = useState<Verse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getThemeColor = (scheme: string) => {
    switch (scheme) {
      case "red":
        return Color.Red;
      case "green":
        return Color.Green;
      case "orange":
        return Color.Orange;
      case "purple":
        return Color.Purple;
      case "blue":
      default:
        return Color.Blue;
    }
  };
  const themeColor = getThemeColor(preferences.colorScheme);

  // Load verses concurrently for Vedic API (which requires verse-by-verse fetch)
  // Or fetch single chapter array for RapidAPI
  useState(() => {
    const fetchVerses = async () => {
      try {
        if (isVedic) {
          const promises = [];
          for (let i = 1; i <= versesCount; i++) {
            promises.push(
              fetch(
                `https://vedicscriptures.github.io/slok/${chapterNumber}/${i}`,
              ).then((r) => r.json()),
            );
          }
          const results = await Promise.all(promises);
          const formatted = results.map((v: any) => ({
            chapter: v.chapter,
            verse: v.verse,
            sanskrit: v.slok,
            translation: v.siva?.et || v.tej?.ht || "Translation not available",
          }));
          setVerses(formatted);
        } else {
          // Rapid API
          const options = {
            method: "GET",
            headers: {
              "X-RapidAPI-Key": preferences.apiKey || "",
              "X-RapidAPI-Host": "bhagavad-gita3.p.rapidapi.com",
            },
          };
          const response = await fetch(
            `https://bhagavad-gita3.p.rapidapi.com/v2/chapters/${chapterNumber}/verses/`,
            options,
          );
          const data = await response.json();
          // Map rapidapi data to Verse format
          if (Array.isArray(data)) {
            const formatted = data.map((v: any) => ({
              chapter: v.chapter_number,
              verse: v.verse_number,
              sanskrit: v.text,
              translation: v.translations?.[0]?.description || "",
            }));
            setVerses(formatted);
          }
        }
      } catch (err: any) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to fetch verses",
          message: err.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerses();
  });

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder={`Search Verses in Chapter ${chapterNumber}...`}
      isShowingDetail={true}
    >
      {verses.map((v) => (
        <List.Item
          key={`${v.chapter}-${v.verse}`}
          title={`Verse ${v.verse}`}
          icon={{ source: Icon.TextDocument, tintColor: themeColor }}
          detail={
            <List.Item.Detail
              markdown={`## Chapter ${v.chapter}, Verse ${v.verse}\n\n---\n\n${preferences.showSanskrit
                  ? `### Sanskrit\n\n\`\`\`text\n${v.sanskrit}\n\`\`\`\n\n---\n\n`
                  : ""
                }### Translation\n\n${v.translation}`}
            />
          }
          actions={
            <ActionPanel>
              <Action.CopyToClipboard
                title="Copy Translation"
                content={`${v.translation} - Bhagavad Gita ${v.chapter}:${v.verse}`}
              />
              {preferences.showSanskrit && (
                <Action.CopyToClipboard
                  title="Copy Sanskrit"
                  content={`${v.sanskrit}\n- Bhagavad Gita ${v.chapter}:${v.verse}`}
                />
              )}
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
