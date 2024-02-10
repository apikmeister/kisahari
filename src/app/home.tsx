"use client";

import { cn, formatDate } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";
import { chatStream, getAllModels } from "@/lib/llm";
import type { ChatResponse, ListResponse } from "ollama";

import AIChat from "@/components/home/ai-chat";
import Footer from "@/components/home/footer";
import Container from "@/components/home/container";
import EntriesContainer from "@/components/home/entries-container";
import Entry from "@/components/home/entry";
import Header from "@/components/home/header";
import AIButton from "@/components/home/ai-button";
import DayProgress from "@/components/home/day-progress";

const data = {
  title: "KISAHARI",
  version: "v010",
  footer: {
    left_copy: "A JOURNAL BY N1",
    right_copy: "KISAHARI © 2024",
  },
};

export default function HomePage({ entries }: { entries: Entry[] }) {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [time, setTime] = useState("");
  const [showAI, setShowAI] = useState(true);
  const [models, setModels] = useState<ListResponse>();
  const [model, setModel] = useState<string>("nous-hermes2:latest");

  const askStream = useCallback(
    async (formData: FormData) => {
      const q = formData.get("q") as string;
      setLoading(true);

      const streams = (await chatStream(entries, q, model)) as AsyncGenerator<
        ChatResponse,
        void,
        unknown
      >;
      let answer = [];
      let chatTime = [""];
      for await (const chat of streams) {
        chatTime = [
          `LOAD:${(chat.load_duration / 1000000000).toFixed(1)}s`,
          `TOTAL:${(chat.total_duration / 1000000000).toFixed(1)}s`,
          `EVAL:${(chat.eval_duration / 1000000000).toFixed(1)}s`,
          `PROMPT:${(chat.prompt_eval_duration / 1000000000).toFixed(1)}s`,
        ];

        answer.push(chat.message.content);
        const ans = answer.join("");

        setAnswer(ans);
      }

      setTime(chatTime.join(" "));

      setLoading(false);
    },
    [model, entries]
  );

  useEffect(() => {
    const getModels = async () => {
      const models = await getAllModels();
      setModels(models);
    };
    getModels();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "k") {
        setShowAI(!showAI);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showAI]);

  return (
    <Container>
      <Header data={data} models={models!} setModel={setModel} />

      <EntriesContainer>
        {entries.map((entry) => (
          <Entry
            key={entry.id}
            date={formatDate(entry.created)}
            title={entry.title}
            content={entry.content}
          />
        ))}
      </EntriesContainer>

      <DayProgress />

      {showAI && (
        <AIChat
          {...{
            answer,
            time,
            loading,
            askStream,
            setAnswer,
            setTime,
            setLoading,
          }}
        />
      )}

      <AIButton {...{ showAI, setShowAI }} />

      <Footer {...data} />
    </Container>
  );
}
