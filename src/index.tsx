import {
  List,
  Icon,
  getPreferenceValues,
  Color,
  ActionPanel,
  Action,
  Toast,
  showToast,
  openExtensionPreferences,
} from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useState, useEffect } from "react";
import fetch from "node-fetch";
import { AIExplanation } from "./components/AIExplanation";

interface Preferences {
  colorScheme: "blue" | "green" | "purple" | "orange" | "red";
  showSanskrit: boolean;
  apiSource: "vedic" | "gita";
  apiKey?: string;
  translationLanguage: string;
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
          actions={
            <ActionPanel>
              <Action
                title="Open Extension Preferences"
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
      </List>
    );
  }

  let chapters: Chapter[] = [];
  if (data) {
    chapters = data;
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search chapters...">
      {chapters.map((ch: any) => {
        const title = isVedic
          ? `Chapter ${ch.chapter_number}: ${ch.name}`
          : `Chapter ${ch.chapter_number}: ${ch.name_meaning}`;

        const subtitle = isVedic
          ? `${ch.translation || ""} • ${ch.verses_count} Verses`
          : `${ch.verses_count} Verses`;

        const keywords = isVedic
          ? ([ch.name, ch.translation, ch.meaning?.en, ch.meaning?.hi].filter(
              Boolean,
            ) as string[])
          : [ch.name_meaning];

        return (
          <List.Item
            key={ch.chapter_number}
            title={title}
            subtitle={subtitle}
            keywords={keywords}
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
                <Action.Push
                  title={`Summarize in ${preferences.translationLanguage}`}
                  icon={Icon.Stars}
                  shortcut={{ modifiers: ["cmd"], key: "s" }}
                  target={
                    <AIExplanation
                      title={`Chapter ${ch.chapter_number} Summary`}
                      prompt={`Summarize the key themes and lessons from Chapter ${ch.chapter_number} of the Bhagavad Gita. Please provide your response in ${preferences.translationLanguage}.`}
                    />
                  }
                />
                <Action
                  title="Open Extension Preferences"
                  onAction={openExtensionPreferences}
                />
              </ActionPanel>
            }
          />
        );
      })}
      {!isLoading && chapters.length === 0 && (
        <List.EmptyView
          title="No chapters found"
          description={
            !isVedic && !preferences.apiKey
              ? "Please set your RapidAPI key in preferences or switch to Vedic Scriptures source."
              : "Try a different search term"
          }
          icon={Icon.MagnifyingGlass}
          actions={
            <ActionPanel>
              <Action
                title="Open Extension Preferences"
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
      )}
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
  useEffect(() => {
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
            translation:
              v.siva?.et ||
              v.tej?.ht ||
              v.adi?.et ||
              v.gambir?.et ||
              "Translation not available",
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
  }, [chapterNumber, versesCount, isVedic, preferences.apiKey]);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder={`Search Verses in Chapter ${chapterNumber}...`}
      isShowingDetail={true}
    >
      {verses.map((v) => (
        <List.Item
          key={`${v.chapter}-${v.verse}`}
          title={`Verse ${v.verse} - ${v.translation.replace(/^[\d\.]+\s*/, "")}`}
          subtitle=""
          keywords={[v.translation, v.sanskrit]}
          icon={{ source: Icon.TextDocument, tintColor: themeColor }}
          detail={
            <List.Item.Detail
              markdown={`## Chapter ${v.chapter}, Verse ${v.verse}\n\n---\n\n${
                preferences.showSanskrit
                  ? `### Sanskrit\n\n> **${v.sanskrit.replace(/\\n/g, "**  \n> **")}**\n\n---\n\n`
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
              <Action.Push
                title={`Explain in ${preferences.translationLanguage}`}
                icon={Icon.Stars}
                shortcut={{ modifiers: ["cmd"], key: "e" }}
                target={
                  <AIExplanation
                    title={`Chapter ${v.chapter}, Verse ${v.verse} Explanation`}
                    prompt={`Provide a philosophical explanation and practical modern-day application of this Bhagavad Gita verse (Chapter ${v.chapter}, Verse ${v.verse}): "${v.translation}". Please provide your response in ${preferences.translationLanguage}.`}
                  />
                }
              />
              <Action.Push
                title={`Translate to ${preferences.translationLanguage}`}
                icon={Icon.Message}
                shortcut={{ modifiers: ["cmd"], key: "t" }}
                target={
                  <AIExplanation
                    title={`Chapter ${v.chapter}, Verse ${v.verse} Translation`}
                    prompt={`Translate this Bhagavad Gita verse (Sanskrit: "${v.sanskrit}", English: "${v.translation}") into ${preferences.translationLanguage}. Provide the direct translation first, followed by a brief textual meaning in ${preferences.translationLanguage}.`}
                  />
                }
              />
              <Action
                title="Open Extension Preferences"
                onAction={openExtensionPreferences}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
