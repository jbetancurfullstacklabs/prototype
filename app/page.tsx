"use client";
import { GAME_LIST, COMMON_WORDS } from "../constants";
import React, { useState } from "react";

export default function Home() {
  const [word, setWord] = useState("");
  const [mainLetter, setMainLetter] = useState("");
  const [pangrams, setPangrams] = useState<string[]>([]);
  const [wordsWithLettersAndMainLetter, setWordsWithLettersAndMainLetter] =
    useState<string[]>([]);
  const [longWords, setLongWords] = useState<number>(0);
  const [medianValue, setMedianValue] = useState<number>(0);
  const [medianPoints, setMedianPoints] = useState<number | null>(0);
  const [medianPoints12, setMedianPoints12] = useState<number | null>(0);
  const [medianMaxPoints12, setMedianMaxPoints12] = useState<number | null>(0);

  function calculateMedianRemovingKey(
    obj: Record<string, number>,
    keyToRemove: string
  ) {
    const rest = Object.keys(obj)
      .filter((key) => key !== keyToRemove)
      .reduce((acc, key) => ({ ...acc, [key]: obj[key] }), {});

    const values = Object.values(rest);

    if (values.length === 0) return 0;

    const sortedValues = [...values].sort(
      (a, b) => (a as number) - (b as number)
    ) as number[];
    const midIndex = Math.floor(sortedValues.length / 2);

    if (sortedValues.length % 2 === 0) {
      return (sortedValues[midIndex - 1] + sortedValues[midIndex]) / 2;
    } else {
      return sortedValues[midIndex];
    }
  }

  function calculateMedian(values: number[]) {
    if (values.length === 0) return null; // Handle empty array

    const sortedValues = [...values].sort((a, b) => a - b);
    const middleIndex = Math.floor(sortedValues.length / 2);

    if (sortedValues.length % 2 === 0) {
      return (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2;
    } else {
      return sortedValues[middleIndex];
    }
  }

  function arrangeWordsByLength(words: string[]): string[] {
    return words.sort((a, b) => b.length - a.length);
  }

  function findHighestValue(numbers: number[]) {
    if (numbers.length === 0) {
      return null; // Return null if the array is empty
    }
    return Math.max(...numbers);
  }

  function filterWords(
    word: string,
    mainLetter: string,
    wordList: string[],
    commonWordsList: string[]
  ): [
    string[],
    string[],
    number,
    number,
    number | null,
    number | null,
    number | null
  ] {
    const lowercaseMainLetter = mainLetter.toLowerCase();
    const letters = new Set(word.toLowerCase().split(""));
    const wordsWithLetters = wordList.filter((listWord: string) => {
      return [...new Set(listWord.toLowerCase().split(""))].every((letter) =>
        letters.has(letter)
      );
    });

    const wordsWithLettersAndMainLetter = wordsWithLetters.filter(
      (listWord: string) => listWord.toLowerCase().includes(lowercaseMainLetter)
    );

    const letterCount: { [key: string]: number } = {};
    [...letters].forEach((letter) => {
      letterCount[letter] = wordsWithLettersAndMainLetter.filter(
        (listWord: string) => {
          const letterOccurrences = listWord
            .toLowerCase()
            .split("")
            .filter((l) => l === letter).length;
          return letterOccurrences >= 2;
        }
      ).length;
    });

    const medianValue = calculateMedianRemovingKey(letterCount, mainLetter);

    const pangrams = wordsWithLettersAndMainLetter.filter(
      (listWord: string) => {
        const wordLetters = new Set(listWord.split(""));
        return [...letters].every((letter) => wordLetters.has(letter));
      }
    );

    const longestWords = arrangeWordsByLength(
      wordsWithLettersAndMainLetter
    ).slice(0, 400);

    const letterOccurrencesInLongestWords: Record<
      string,
      {
        occurrences: Record<string, number>;
        score: Record<string, number>;
        total: number;
        lenscore: number;
      }
    > = {};

    const sortedLetters = Array.from(new Set(word)).sort();
    const lenscoreIndexArray = [0, 0, 0, 0, 2, 4, 6, 12];
    const scores: number[] = [];
    const scores12: number[] = [];
    const scores12ByLetter: Record<string, number[]> = {};

    longestWords.forEach((longestWord, indexLongestWord) => {
      letterOccurrencesInLongestWords[longestWord] = {
        occurrences: {},
        score: {},
        total: 0,
        lenscore: 0,
      };
      sortedLetters.forEach((letter) => {
        const count = longestWord.split("").filter((l) => l === letter).length;
        letterOccurrencesInLongestWords[longestWord].occurrences[letter] =
          count;
        letterOccurrencesInLongestWords[longestWord].total += count;
      });

      const sum = letterOccurrencesInLongestWords[longestWord].total;
      const isPangram = pangrams.includes(longestWord);

      if (longestWord.length >= 8) {
        letterOccurrencesInLongestWords[longestWord].lenscore =
          (sum - 7) * 3 + 12 + (isPangram ? 7 : 0);
      } else {
        letterOccurrencesInLongestWords[longestWord].lenscore =
          lenscoreIndexArray[longestWord.length];
      }

      sortedLetters.forEach((letter) => {
        if (letter !== mainLetter) {
          letterOccurrencesInLongestWords[longestWord].score[letter] =
            letterOccurrencesInLongestWords[longestWord].lenscore +
            letterOccurrencesInLongestWords[longestWord].occurrences[letter] *
              5;
          scores.push(
            letterOccurrencesInLongestWords[longestWord].score[letter]
          );
          if (indexLongestWord < 12) {
            scores12.push(
              letterOccurrencesInLongestWords[longestWord].score[letter]
            );
            if (!scores12ByLetter[letter]) {
              scores12ByLetter[letter] = [];
            }
            scores12ByLetter[letter].push(
              letterOccurrencesInLongestWords[longestWord].score[letter]
            );
          }
        }
      });
    });

    const maxScoreByLetter12: number[] = [];

    sortedLetters.forEach((letter) => {
      if (letter !== mainLetter) {
        const maxScore = findHighestValue(scores12ByLetter[letter]);
        if (maxScore !== null) {
          maxScoreByLetter12.push(maxScore);
        }
      }
    });

    const additionalFilterSet = new Set(
      commonWordsList.map((word: string) => word.toLowerCase())
    );
    const finalFilteredWords = wordsWithLettersAndMainLetter.filter(
      (listWord: string) => additionalFilterSet.has(listWord.toLowerCase())
    );

    const longWords = finalFilteredWords.filter(
      (word: string) => typeof word === "string" && word.length > 5
    ).length;

    const medianPoints = calculateMedian(scores);
    const medianPoints12 = calculateMedian(scores12);
    const medianMaxPoints12 = calculateMedian(maxScoreByLetter12);

    return [
      wordsWithLettersAndMainLetter,
      pangrams,
      medianValue,
      longWords,
      medianPoints,
      medianPoints12,
      medianMaxPoints12,
    ];
  }

  const handleFilter = () => {
    const [
      wordsWithLettersAndMainLetter,
      pangrams,
      medianValue,
      longWords,
      medianPoints,
      medianPoints12,
      medianMaxPoints12,
    ] = filterWords(word, mainLetter, GAME_LIST, COMMON_WORDS);

    setPangrams(pangrams);
    setWordsWithLettersAndMainLetter(wordsWithLettersAndMainLetter);
    setLongWords(longWords);
    setMedianValue(medianValue);
    setMedianPoints(medianPoints);
    setMedianPoints12(medianPoints12);
    setMedianMaxPoints12(medianMaxPoints12);
  };

  return (
    <div>
      <div className="flex flex-col items-center space-y-4 p-4">
        <div>
          <input
            type="text"
            placeholder="Enter a word"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            className="border border-gray-300 text-gray-900 rounded-md p-2"
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Enter a letter"
            value={mainLetter}
            onChange={(e) => setMainLetter(e.target.value)}
            className="border border-gray-300 text-gray-900 rounded-md p-2"
          />
        </div>
        <button
          onClick={handleFilter}
          className="bg-blue-500 text-white rounded-md p-2 hover:bg-blue-600"
        >
          Analize
        </button>

        <div>common 5+ letters: {longWords}</div>
        <div>med repeated letters: {medianValue}</div>
        <div>med score, all words: {medianPoints}</div>
        <div>med score, top 12 points (&gt;25): {medianPoints12}</div>
        <div>Median points top 12 scoring words: {medianMaxPoints12}</div>

        <div className="mt-4 font-semibold">
          total pangrams: {pangrams.length}
        </div>
        {pangrams && pangrams.length > 0 && (
          <div className="mt-2 space-y-2 overflow-auto border rounded-md h-48 p-2">
            {pangrams.map((pangram, index) => (
              <div key={index} className="border-b border-gray-200 pb-2">
                {pangram}
              </div>
            ))}
          </div>
        )}

        <div>word count: {wordsWithLettersAndMainLetter.length}</div>
        {wordsWithLettersAndMainLetter &&
          wordsWithLettersAndMainLetter.length > 0 && (
            <div className="mt-2 space-y-2 overflow-auto border rounded-md h-48 p-2">
              {wordsWithLettersAndMainLetter.map((word, index) => (
                <div key={index} className="border-b border-gray-200 pb-2">
                  {word}
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}
