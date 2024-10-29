"use client";
import { GAME_LIST, COMMON_WORDS } from "../constants";
import React, { useState } from "react";
import classNames from "classnames";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { basicDark } from "@uiw/codemirror-theme-basic";

// Main component that renders the homepage and handles word analysis
export default function Home() {
  interface FilteredByLetterCommonWords {
    word: string;
    pangrams: string[];
    commonPangrams: string[];
    playableWords: string[];
    playableCommonWords: string[];
  }

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
  const [letterMainWord, setLetterMainWord] = useState<string[]>([]);
  const [results, setResults] = useState<FilteredByLetterCommonWords[]>([]);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Calculate the median of numbers in an object after removing a specific key
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

  // Calculate the median of an array of numbers
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

  // Arrange an array of words by their length in descending order
  function arrangeWordsByLength(words: string[]): string[] {
    return words.sort((a, b) => b.length - a.length);
  }

  // Find the highest value in an array of numbers
  function findHighestValue(numbers: number[]) {
    if (numbers.length === 0) {
      return null; // Return null if the array is empty
    }
    return Math.max(...numbers);
  }

  function getUniqueLettersExcludingInitial(
    word: string,
    initial: string
  ): string[] {
    // Convert the word to lowercase to handle case insensitivity
    const lowerCaseWord = word.toLowerCase();
    const lowerCaseInitial = initial.toLowerCase();

    // Use a Set to store unique characters excluding the initial letter
    const uniqueLettersSet: Set<string> = new Set();

    for (const letter of lowerCaseWord) {
      if (letter !== lowerCaseInitial) {
        uniqueLettersSet.add(letter as string); // Type assertion
      }
    }

    const uniqueLettersArray: string[] = Array.from(uniqueLettersSet).sort();

    return uniqueLettersArray;
  }

  // Filter words based on criteria including presence of letters and main letter
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
    number | null,
    string[]
  ] {
    const lowercaseMainLetter = mainLetter.toLowerCase();
    const letters = new Set(word.toLowerCase().split(""));

    // Get all words that contain all the letters in the main word
    const wordsWithLetters = wordList.filter((listWord: string) => {
      return [...new Set(listWord.toLowerCase().split(""))].every((letter) =>
        letters.has(letter)
      );
    });

    // Get all words that contain the main letter
    const wordsWithLettersAndMainLetter = wordsWithLetters.filter(
      (listWord: string) => listWord.toLowerCase().includes(lowercaseMainLetter)
    );

    // Calculate the number of occurrences of each letter
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

    // Calculate the median of the letter count values excluding the main letter
    const medianValue = calculateMedianRemovingKey(letterCount, mainLetter);

    // Get all pangrams that contain all the letters
    const pangrams = wordsWithLettersAndMainLetter.filter(
      (listWord: string) => {
        const wordLetters = new Set(listWord.toLowerCase().split(""));
        return [...letters].every((letter) => wordLetters.has(letter));
      }
    );

    // Get the top 400 longest words pangrams that contain the main letter
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
    const letterMainWord = getUniqueLettersExcludingInitial(word, mainLetter);

    return [
      wordsWithLettersAndMainLetter,
      pangrams,
      medianValue,
      longWords,
      medianPoints,
      medianPoints12,
      medianMaxPoints12,
      letterMainWord,
    ];
  }

  const hasSevenDifferentLetters = (word: string): boolean => {
    const uniqueLetters = new Set(word.toLowerCase());
    return uniqueLetters.size == 7;
  };

  const isPlayableWord = (word: string): boolean => {
    const uniqueLetters = new Set(word.toLowerCase());
    return uniqueLetters.size <= 7;
  };

  const commonWordsPlayable = COMMON_WORDS.filter((word) =>
    isPlayableWord(word)
  );

  const gameListPlayables = GAME_LIST.filter((word) => isPlayableWord(word));

  const handleLetterClick = (letter: string) => {
    const commonWordsByInitialPangrams = COMMON_WORDS.filter(
      (word) =>
        word.toLowerCase().startsWith(letter.toLowerCase()) &&
        hasSevenDifferentLetters(word)
    );

    const commonWordsFilteredByLetterPangrams = COMMON_WORDS.filter(
      (word) =>
        word.toLowerCase().includes(letter.toLowerCase()) &&
        hasSevenDifferentLetters(word)
    );

    const gameListPangrams = GAME_LIST.reduce<
      {
        word: string;
        isPangram: boolean;
        sequence: string;
      }[]
    >((acc, word) => {
      if (word.toLowerCase().includes(letter.toLowerCase())) {
        const isPangram = hasSevenDifferentLetters(word);
        const uniqueChars = new Set(word.toLowerCase());
        const sequence = Array.from(uniqueChars).sort().join("");

        if (isPangram) {
          acc.push({
            word,
            isPangram,
            sequence,
          });
        }
      }
      return acc;
    }, []);

    const filteredByLetterCommonWords: FilteredByLetterCommonWords[] = [];

    const commonWordsSet = new Set(
      commonWordsFilteredByLetterPangrams.map((word) => word.toLowerCase())
    );

    commonWordsByInitialPangrams.forEach((commonWordByInitialPangram) => {
      const pangrams: string[] = [];
      const commonPangrams: string[] = [];
      const playableWords: string[] = [];
      const playableCommonWords: string[] = [];

      const letterSet = new Set(commonWordByInitialPangram.toLowerCase());
      gameListPangrams.forEach(({ word, sequence }) => {
        if (sequence === Array.from(letterSet).sort().join("")) {
          pangrams.push(word);
          if (commonWordsSet.has(word.toLowerCase())) {
            commonPangrams.push(word);
          }
        }
      });

      if (pangrams.length >= 10 && commonPangrams.length >= 5) {
        filteredByLetterCommonWords.push({
          word: commonWordByInitialPangram,
          pangrams,
          commonPangrams,
          playableWords,
          playableCommonWords,
        });
      }
    });

    filteredByLetterCommonWords.forEach((filteredByLetterCommonWord, index) => {
      const playableWords = gameListPlayables.filter((word) => {
        const allowedSet = new Set(
          filteredByLetterCommonWord.word.toLowerCase()
        );
        for (const char of word.toLowerCase()) {
          if (!allowedSet.has(char)) {
            return false;
          }
        }
        if (commonWordsPlayable.includes(word) && word.length >= 5) {
          filteredByLetterCommonWords[index].playableCommonWords.push(word);
        }
        return true;
      });
      filteredByLetterCommonWords[index].playableWords = playableWords;
    });

    filteredByLetterCommonWords.sort(
      (a, b) => b.pangrams.length - a.pangrams.length
    );
    setResults(filteredByLetterCommonWords);

    console.log(filteredByLetterCommonWords);
  };

  // Handle the filtering process triggered by user action
  const handleFilter = () => {
    const [
      wordsWithLettersAndMainLetter,
      pangrams,
      medianValue,
      longWords,
      medianPoints,
      medianPoints12,
      medianMaxPoints12,
      letterMainWord,
    ] = filterWords(word, mainLetter, GAME_LIST, COMMON_WORDS);

    setPangrams(pangrams);
    setWordsWithLettersAndMainLetter(wordsWithLettersAndMainLetter);
    setLongWords(longWords);
    setMedianValue(medianValue);
    setMedianPoints(medianPoints);
    setMedianPoints12(medianPoints12);
    setMedianMaxPoints12(medianMaxPoints12);
    setLetterMainWord(letterMainWord);
  };

  return (
    <div className="">
      <div className="flex flex-col items-center space-y-4 p-4">
        {/* Render buttons for each letter in the alphabet */}
        <h3 className="inline-block text-2xl font-extrabold text-slate-900 tracking-tight dark:text-slate-200">
          Filter commons words by initial
        </h3>
        <div className="flex flex-wrap items-center justify-center">
          {alphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              className="bg-gray-800 text-white rounded-md p-3 m-2 hover:bg-gray-700 shadow-md"
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Render Matching Results */}
        {results && results.length > 0 && (
          <div className="bg-slate-800 rounded-lg px-6 py-8 ring-1 ring-slate-900/5 shadow-xl">
            <table className="border-collapse border border-slate-500">
              <thead>
                <tr className="">
                  <th className="border border-slate-300 dark:border-slate-600 font-semibold p-4 text-slate-900 dark:text-slate-200 text-center">
                    Words
                  </th>
                  <th className="border border-slate-300 dark:border-slate-600 font-semibold p-4 text-slate-900 dark:text-slate-200 text-center">
                    Pangrams
                    <br />({">"} 10)
                  </th>
                  <th className="border border-slate-300 dark:border-slate-600 font-semibold p-4 text-slate-900 dark:text-slate-200 text-center">
                    Common word pangrams
                    <br />({">"} 5)
                  </th>
                  <th className="border border-slate-300 dark:border-slate-600 font-semibold p-4 text-slate-900 dark:text-slate-200 text-center">
                    Playable words
                  </th>
                  <th className="border border-slate-300 dark:border-slate-600 font-semibold p-4 text-slate-900 dark:text-slate-200 text-center">
                    Playable common words with more than 5 letters
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((FilteredCommonWord, index) => (
                  <tr key={index} className="">
                    <td className="border border-slate-300 dark:border-slate-700 p-4 text-slate-500 dark:text-slate-400">
                      {FilteredCommonWord.word}
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 p-4 text-slate-500 dark:text-slate-400 text-center">
                      {FilteredCommonWord.pangrams.length}
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 p-4 text-slate-500 dark:text-slate-400 text-center">
                      {FilteredCommonWord.commonPangrams.length}
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 p-4 text-slate-500 dark:text-slate-400 text-center">
                      {FilteredCommonWord.playableWords.length}
                    </td>
                    <td className="border border-slate-300 dark:border-slate-700 p-4 text-slate-500 dark:text-slate-400 text-center">
                      {FilteredCommonWord.playableCommonWords.length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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

        <div className="flex items-center flex-wrap justify-center w-[150px]">
          {letterMainWord.map((letter, index) => (
            <>
              <div
                key={index}
                className={classNames(
                  index === 0 ? "ml-[1px]" : "",
                  "flex items-center justify-center text-black bg-white border border-gray-300 w-[50px] h-16r"
                )}
              >
                {letter}
              </div>
              {index === 2 && (
                <div className="flex items-center justify-center text-black bg-white border border-gray-300 w-[50px] h-16r">
                  {mainLetter}
                </div>
              )}
            </>
          ))}
        </div>

        <div className="bg-slate-800 rounded-lg px-6 py-8 ring-1 ring-slate-900/5 shadow-xl">
          <div>
            <span className="mt-4 font-semibold">Puzzle ID: </span>
            <span>
              {mainLetter.toUpperCase()}-
              {letterMainWord.map((letter) => (
                <>{letter === mainLetter ? "" : letter.toUpperCase()}</>
              ))}
            </span>
          </div>
          <div>
            <span className="mt-4 font-semibold">common 5+ letters: </span>
            <span>{longWords}</span>
          </div>
          <div>
            <span className="mt-4 font-semibold">med repeated letters: </span>
            <span>{medianValue}</span>
          </div>
          <div>
            <span className="mt-4 font-semibold">med score, all words: </span>
            <span>{medianPoints}</span>
          </div>
          <div>
            <span className="mt-4 font-semibold">
              med score, top 12 points (&gt;25):{" "}
            </span>
            <span>{medianPoints12}</span>
          </div>
          <div>
            <span className="mt-4 font-semibold">
              Median points top 12 scoring words:{" "}
            </span>
            <span>{medianMaxPoints12}</span>
          </div>

          <div>
            <span className="mt-4 font-semibold">total pangrams:</span>
            <span>{pangrams.length}</span>
          </div>
          {pangrams && pangrams.length > 0 && (
            <CodeMirror
              className="mb-4"
              value={pangrams.join("\n")}
              height="200px"
              theme={basicDark}
              extensions={[javascript({ jsx: true })]}
              onChange={() => {}}
            />
          )}

          <div>
            <span className="mt-4 font-semibold">Playable words: </span>
            <span>{wordsWithLettersAndMainLetter.length}</span>
          </div>

          {wordsWithLettersAndMainLetter &&
            wordsWithLettersAndMainLetter.length > 0 && (
              <CodeMirror
                value={
                  '[\n"' + wordsWithLettersAndMainLetter.join('",\n"') + '"\n]'
                }
                height="200px"
                theme={basicDark}
                extensions={[javascript({ jsx: true })]}
                onChange={() => {}}
              />
            )}
        </div>
      </div>
    </div>
  );
}
