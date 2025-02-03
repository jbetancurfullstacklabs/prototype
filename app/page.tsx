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

  interface Combination {
    letter: string;
    sequence: string;
    word: string;
    wordsWithLettersAndMainLetter: string[];
    pangrams: string[];
    medianValue: number;
    longWords: number;
    medianPoints: number | null;
    medianPoints12: number | null;
    medianMaxPoints12: number | null;
    letterMainWord: string[];
  }

  const [word, setWord] = useState("");
  const [initialLetter, setInitialLetter] = useState("");
  const [mainLetter, setMainLetter] = useState("");
  const [pangrams, setPangrams] = useState<string[]>([]);
  const [wordsWithLettersAndMainLetter, setWordsWithLettersAndMainLetter] =
    useState<string[]>([]);
  const [letterMainWord, setLetterMainWord] = useState<string[]>([]);
  const [filteredResults, setFilteredResults] = useState<
    FilteredByLetterCommonWords[]
  >([]);

  const [combinations, setCombinations] = useState<Combination[]>([]);
  const [sequence, setSequence] = useState<Combination>();

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e?.target as HTMLInputElement; 
    const value = target.value;

    // Check if the last typed character is already in the input value
    const lastChar = value[value.length - 1];
    if (value.slice(0, -1).includes(lastChar)) {
      // If the character is repeated, ignore it
      return;
    }

    // Update the input value
    setInputValue(value);

    // Check if the input has at least 2 unique characters
    const uniqueChars = new Set(value).size;
    setIsValid(uniqueChars >= 2 && value.length >= 2);

    if (uniqueChars >= 2 || value.length >= 2) {
      setFilteredResults([]);
      setCombinations([]);
    }
  };

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
    mainLetter: string
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
    setCombinations([]);
    setPangrams([]);
    setMainLetter("");
    setLetterMainWord([]);
    setWordsWithLettersAndMainLetter([]);

    const lowercaseMainLetter = mainLetter.toLowerCase();
    const letters = new Set(word.toLowerCase().split(""));

    // Get all words that contain all the letters in the main word
    const wordsWithLetters = GAME_LIST.filter((listWord: string) => {
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
      COMMON_WORDS.map((word: string) => word.toLowerCase())
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

  const searchHandler = () => {
    setCombinations([]);
    setPangrams([]);
    setMainLetter("");
    setLetterMainWord([]);
    setWordsWithLettersAndMainLetter([]);
    const commonWordsByInitialPangrams = COMMON_WORDS.filter(
      (word) =>
        word.toLowerCase().startsWith(initialLetter) &&
        hasSevenDifferentLetters(word) &&
        inputValue.split('').every(char => word.includes(char))
    );

    const commonWordsFilteredByLetterPangrams = COMMON_WORDS.filter(
      (word) =>
        word.toLowerCase().includes(initialLetter) &&
        hasSevenDifferentLetters(word) &&
        inputValue.split('').every(char => word.includes(char))
    );

    const gameListPlayablesFilteredLetter = gameListPlayables.filter(
      (word) =>
        word.toLowerCase().includes(initialLetter)
    );

    const gameListPangrams = GAME_LIST.reduce<
      {
        word: string;
        isPangram: boolean;
        sequence: string;
      }[]
    >((acc, word) => {
      if (word.toLowerCase().includes(initialLetter)) {
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

      const letterSet = new Set(commonWordByInitialPangram.toLowerCase());
      const sortedLetterSequence = Array.from(letterSet).sort().join("");

      const gameListPangramsFilteredSequence = gameListPangrams.filter((pangram) => {
        return pangram.sequence === sortedLetterSequence;
      });

      const gameListPangramsFilterePlayable = gameListPlayablesFilteredLetter.filter((word) => {
        for (const char of word.toLowerCase()) {
          if (!letterSet.has(char)) {
            return false;
          }
        }
        return true;
      });

      const gameListPangramsFilterePlayableCommon = gameListPangramsFilterePlayable.filter((word) => {
        return commonWordsPlayable.includes(word) && word.length >= 5
      });

      gameListPangramsFilteredSequence.forEach(({ word }) => {
        pangrams.push(word);
        if (commonWordsSet.has(word.toLowerCase())) {
          commonPangrams.push(word);
        }
      });

      if (pangrams.length >= 1 && gameListPangramsFilterePlayable.length >= 150 && gameListPangramsFilterePlayableCommon.length >= 15 ) {
        filteredByLetterCommonWords.push({
          word: commonWordByInitialPangram,
          pangrams,
          commonPangrams,
          playableWords: gameListPangramsFilterePlayable,
          playableCommonWords: gameListPangramsFilterePlayableCommon,
        });
      }
    });

    filteredByLetterCommonWords.sort(
      (a, b) => b.pangrams.length - a.pangrams.length
    );
    setFilteredResults(filteredByLetterCommonWords);

  };

  const showWordAnalisis = (word: string) => {
    setCombinations([]);
    setPangrams([]);
    setMainLetter("");
    setLetterMainWord([]);
    setWordsWithLettersAndMainLetter([]);
    setWord(word);
    const lowerCaseWord = word.toLowerCase();
    const uniqueLettersSet: Set<string> = new Set();

    const combinationsWords: Combination[] = [];

    for (const letter of lowerCaseWord) {
      uniqueLettersSet.add(letter as string); // Type assertion
    }

    const uniqueLettersArray: string[] = Array.from(uniqueLettersSet).sort();

    [...uniqueLettersArray].forEach((letter) => {
      const sequence = uniqueLettersArray
        .filter(function (char) {
          return char !== letter;
        })
        .join("");

      const [
        wordsWithLettersAndMainLetter,
        pangrams,
        medianValue,
        longWords,
        medianPoints,
        medianPoints12,
        medianMaxPoints12,
        letterMainWord,
      ] = filterWords(word, letter);
      if (longWords >= 15 && (medianPoints && medianPoints >= 9) && (medianPoints12 && medianPoints12 >= 23)) {
        combinationsWords.push({
          letter,
          sequence,
          word,
          wordsWithLettersAndMainLetter,
          pangrams,
          medianValue,
          longWords,
          medianPoints,
          medianPoints12,
          medianMaxPoints12,
          letterMainWord,
        });
      }

    });

    setCombinations(combinationsWords);
  };

  const showWord = (index: number) => {
    setPangrams(combinations[index].pangrams);
    setMainLetter(combinations[index].letter);
    setLetterMainWord(combinations[index].letterMainWord);
    setSequence(combinations[index]);
    setWordsWithLettersAndMainLetter(
      combinations[index].wordsWithLettersAndMainLetter
    );
  };

  return (
    <div className="bg-gray-900">
      <div className="flex flex-col items-center space-y-4 p-4">
        {/* Render buttons for each letter in the alphabet */}
        <h3 className="inline-block text-2xl tracking-tight text-slate-200">
          1. Filter all commons words by initial letter:
        </h3>
        <div className="flex flex-wrap items-center justify-center">
          {alphabet.map((letter) => (
            <button
              key={letter}
              onClick={() => {
                setInitialLetter(letter.toLocaleLowerCase());
                setInputValue('');
                setFilteredResults([]);
                setCombinations([]);
              }}
              className={classNames("bg-gray-800 text-white rounded-md p-3 m-2 hover:bg-gray-700 shadow-md", initialLetter === letter.toLocaleLowerCase() ? "bg-pink-800" : "")}
            >
              {letter}
            </button>
          ))}
        </div>

        {initialLetter && (
          <>
            <h3 className="inline-block text-2xl tracking-tigh text-slate-200">
              2. Add a new filter, searching words that start with &quot;{initialLetter.toUpperCase()}&quot; and include next letters:
            </h3>

            <div className="flex items-center gap-4">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                placeholder="Enter at least 2 letters"
                className="flex-1 p-2 border text-gray-900 border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={!isValid}
                onClick={() => searchHandler()}
                className={`p-2 rounded ${
                  isValid
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                See results
              </button>            
            </div>
          </>
        )}


        {/* Render Matching Results */}
        {isValid && initialLetter && inputValue && filteredResults && filteredResults.length > 0 && (
          <>
            <h3 className="inline-block text-2xl tracking-tigh text-slate-200">
              3. Click the common word to check all combinations:
            </h3>
            <div className="bg-slate-800 rounded-lg px-6 py-8 ring-1 ring-slate-900/5 shadow-xl">
              <table className="border-collapse border border-slate-500">
                <thead>
                  <tr className="">
                    <th className="border border-slate-700 font-semibold p-4  text-slate-200 text-center">
                      Common Words
                    </th>
                    <th className="border border-slate-700 font-semibold p-4  text-slate-200 text-center">
                      Pangrams
                    </th>
                    <th className="border border-slate-700 font-semibold p-4  text-slate-200 text-center">
                      Common word pangrams
                    </th>
                    <th className="border border-slate-700 font-semibold p-4  text-slate-200 text-center">
                      Playable words
                      <br />({">"} 150)
                    </th>
                    <th className="border border-slate-700 font-semibold p-4  text-slate-200 text-center">
                      Playable common words with more than 5 letters
                      <br />({">"} 15)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((FilteredCommonWord, index) => (
                    <tr
                      key={index}
                      className={classNames("hover:cursor-pointer", FilteredCommonWord.word === word ? 'bg-pink-800' : 'hover:bg-slate-700')}
                      onClick={() => showWordAnalisis(FilteredCommonWord.word)}
                    >
                      <td className="border border-slate-700 p-4 text-slate-400">
                        {FilteredCommonWord.word}
                      </td>
                      <td className="border border-slate-700 p-4 text-slate-400 text-center">
                        {FilteredCommonWord.pangrams.length}
                      </td>
                      <td className="border border-slate-700 p-4 text-slate-400 text-center">
                        {FilteredCommonWord.commonPangrams.length}
                      </td>
                      <td className="border border-slate-700 p-4 text-slate-400 text-center">
                        {FilteredCommonWord.playableWords.length}
                      </td>
                      <td className="border border-slate-700 p-4 text-slate-400 text-center">
                        {FilteredCommonWord.playableCommonWords.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {isValid && combinations && combinations.length > 0 && (
          <>
            <h3 className="inline-block text-2xl tracking-tight text-slate-200">
              4. Click the combination to see metrics:
            </h3>

            <div className="bg-slate-800 rounded-lg px-6 py-8 ring-1 ring-slate-900/5 shadow-xl">
              <h3 className="inline-block text-2xl font-extrabold  tracking-tight text-slate-200">
                WORD: {word.toUpperCase()}
              </h3>
              <table className="border-collapse border border-slate-500">
                <thead>
                  <tr className="">
                    <th className="border border-slate-700 font-semibold p-4  text-slate-200 text-center">
                      combination:
                    </th>
                    <th className="border border-slate-700 font-semibold p-4  text-slate-200 text-center">
                      common words (5+ letters)
                      <br />({">="} 15)
                    </th>
                    <th className="border border-slate-700 font-semibold p-4  text-slate-200 text-center">
                      med repeated letters:
                    </th>
                    <th className="border border-slate-700 font-semibold p-4  text-slate-200 text-center">
                      med score, all words:
                      <br />({">="} 9)
                    </th>
                    <th className="border border-slate-700 font-semibold p-4  text-slate-200 text-center">
                      med score, longest words:
                      <br />({">="} 23)
                    </th>
                    <th className="border border-slate-700 font-semibold p-4  text-slate-200 text-center">
                      med score, top 12 points:
                    </th>
                    <th className="border border-slate-700 font-semibold p-4  text-slate-200 text-center">
                      pangrams:
                    </th>
                    <th className="border border-slate-700 font-semibold p-4  text-slate-200 text-center">
                      Playable words:
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {combinations.map((combination, index) => (
                    <tr
                      key={index}
                      className={classNames("hover:cursor-pointer", combination.sequence == sequence?.sequence ? "bg-pink-800" : "hover:bg-slate-700")}
                      onClick={() => showWord(index)}
                    >
                      <td className="border border-slate-700 p-4 text-slate-400">
                        {combination.letter.toUpperCase()}-
                        {combination.sequence.toUpperCase()}
                      </td>
                      <td className="border border-slate-700 p-4 text-slate-400 text-center">
                        {combination.longWords}
                      </td>
                      <td className="border border-slate-700 p-4 text-slate-400 text-center">
                        {combination.medianValue}
                      </td>
                      <td className="border border-slate-700 p-4 text-slate-400 text-center">
                        {combination.medianPoints}
                      </td>
                      <td className="border border-slate-700 p-4 text-slate-400 text-center">
                        {combination.medianPoints12}
                      </td>
                      <td className="border border-slate-700 p-4 text-slate-400 text-center">
                        {combination.medianMaxPoints12}
                      </td>
                      <td className="border border-slate-700 p-4 text-slate-400 text-center">
                        {combination.pangrams.length}
                      </td>
                      <td className="border border-slate-700 p-4 text-slate-400 text-center">
                        {combination.wordsWithLettersAndMainLetter.length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {isValid && word && mainLetter && letterMainWord && combinations && combinations.length > 0 && (
          <div className="w-[300px] h-[300px] relative">
            {letterMainWord.map((letter, index) => (
              <div
                key={index}
                className={classNames(
                  "hex",
                  "pos" + index)}>
                {letter}
              </div>
            ))}
            <div className={classNames(
              "hex", 
              "pos6")}>
              {mainLetter}
            </div>
          </div>
        )}

        {isValid && combinations && combinations.length > 0 && pangrams &&
          pangrams.length > 0 &&
          wordsWithLettersAndMainLetter &&
          wordsWithLettersAndMainLetter.length > 0 && (
            <div className="bg-slate-800 rounded-lg px-6 py-8 ring-1 ring-slate-900/5 shadow-xl">
              <h3 className="mb-4 text-2xl font-extrabold  tracking-tight text-slate-200">{mainLetter.toUpperCase()}-{letterMainWord.join("").toUpperCase()}</h3>
              <h4 className="mb-4 text-2xl font-extrabold  tracking-tight text-slate-200">
                Pangrams: {pangrams.length}
              </h4>
              <CodeMirror
                className="mb-4"
                value={pangrams.join("\n")}
                height="200px"
                width="500px"
                theme={basicDark}
                extensions={[javascript({ jsx: true })]}
                onChange={() => {}}
              />
              <h4 className="mb-4 text-2xl font-extrabold  tracking-tight text-slate-200">
                Playable words: {wordsWithLettersAndMainLetter.length}
              </h4>
              <CodeMirror
                className="mb-4"
                value={
                  '[\n"' + wordsWithLettersAndMainLetter.join('",\n"') + '"\n]'
                }
                height="200px"
                width="500px"
                theme={basicDark}
                extensions={[javascript({ jsx: true })]}
                onChange={() => {}}
              />
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      '[\n"' +
                        wordsWithLettersAndMainLetter.join('",\n"') +
                        '"\n]'
                    );
                    console.log("Content copied to clipboard");
                  } catch (err) {
                    console.error("Failed to copy: ", err);
                  }
                }}
                className="bg-black text-white rounded-md p-3 m-2 hover:bg-gray-700 shadow-md"
              >
                Copy Playable Words
              </button>
            
              <br/>
              <div>
                stats<br/>
                common 5+ letters: {sequence?.longWords}<br/>
                med repeated letters: {sequence?.medianValue}<br/>
                total pangrams: {sequence?.pangrams.length}<br/>
                med score, longest words: {sequence?.medianPoints12}<br/>
                med score, top 12 points: {sequence?.medianMaxPoints12}<br/>
                med score, all words: {sequence?.medianPoints}<br/>
              </div>  

            </div>
          )}
      </div>
    </div>
  );
}
