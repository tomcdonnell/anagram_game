<?php
/**************************************************************************************************\
*
* vim: ts=3 sw=3 et wrap co=100 go -=b
*
* Filename: "AnagramGameParser.php"
*
* Project: Anagram Poem Checker.
*
* Purpose: The main file for the project.
*
* Author: Tom McDonnell 2012-05-19.
*
\**************************************************************************************************/

/*
 *
 */
class AnagramGameParser
{
   /*
    *
    */
   public function __construct()
   {
      throw new Exception('This class is not intended to be instantiated.');
   }

   /*
    *
    */
   public static function parseGameData($filenameWithFullPath)
   {
      $fileAsString = file_get_contents($filenameWithFullPath);

      if ($fileAsString === false)
      {
         throw new Exception("Could not open file '$filenameWithFullPath'.");
      }

      $lines = explode("\n", $fileAsString);
      $topic = self::_getTitleFromFirstLine($lines[0]);

      if ($lines[1] != '')
      {
         self::_throwLineFormatException($lineNo, 'This line is expected to be blank.');
      }

      $anagramsByAnswer       = array();
      $expectedNextTokenTypes = array('answer');

      for ($lineNo = 2, $nLines = count($lines); $lineNo < $nLines; ++$lineNo)
      {
         list($tokenType, $tokenContent) = self::_getTokenTypeAndContentFromLine($lines[$lineNo]);

         if (!in_array($tokenType, $expectedNextTokenTypes))
         {
            self::_throwLineFormatException
            (
               $lineNo, "Unexpected token '$tokenType' found.  " .
               "Expected one of {" . implode(', ', $expectedNextTokenTypes) . '}.'
            );
         }

         switch ($tokenType)
         {
          case 'answer':
            $expectedNextTokenTypes = array('anagram');
            $answer                 = $tokenContent;
            $anagrams               = array();
            break;

          case 'anagram':
            $expectedNextTokenTypes = array('anagram', 'blankLine');
            if (!self::_areAnagrams($answer, $tokenContent))
            {
               self::_throwLineFormatException
               (
                  $lineNo, "'$tokenContent' is not an anagram of '$answer'."
               );
            }
            $anagrams[] = $tokenContent;
            break;

          case 'blankLine':
            $expectedNextTokenTypes    = array('answer');
            $anagramsByAnswer[$answer] = $anagrams;
            break;

          default:
            throw new Exception("Unknown token type '$tokenType'.");
         }
      }

      return array($topic, $anagramsByAnswer);
   }

   /*
    *
    */
   private static function _getTitleFromFirstLine($str)
   {
      $strlen = strlen($str);

      if
      (
         substr($str,           0, 25) != 'Anagrams list for topic "' ||
         substr($str, $strlen - 1, 1 ) != '"'
      )
      {
         self::_throwLineFormatException
         (
            0, "The first line should read 'Anagrams list for topic \"[topic name]\"' " .
            'where [topic name] is any string.'
         );
      }

      return substr($str, 25, $strlen - 26);
   }

   /*
    *
    */
   private static function _getTokenTypeAndContentFromLine($str)
   {
      if ($str == '')
      {
         $type    = 'blankLine';
         $content = '';
      }
      elseif (substr($str, 0, 3) == ' * ')
      {
         $type    = 'anagram';
         $content = substr($str, 3);
      }
      elseif (substr($str, 0, 1) != ' ')
      {
         $type    = 'answer';
         $content = $str;
      }

      return array($type, $content);
   }

   /*
    * Return true if after having removed all spaces and punctuation from both strings
    * and converted both strings to lowercase, $stringA is an anagram of $stringB.
    * Return false otherwise.
    */
   private static function _areAnagrams($stringA, $stringB)
   {
      $stringA = strtolower(self::_removeSpacesAndPunctuation($stringA));
      $stringB = strtolower(self::_removeSpacesAndPunctuation($stringB));

      $strlen = strlen($stringA);

      if (strlen($stringB) != $strlen)
      {
         return false;
      }

      $missingLettersString = '';
      $extraLettersString   = '';

      for ($i = 0; $i < $strlen; ++$i)
      {
         $char = $stringA[$i];
         $posB = strpos($stringB, $char);

         if ($posB === false)
         {
            $missingLettersString .= $char;
         }
         else
         {
            $stringB = substr_replace($stringB, '', $posB, 1);
         }
      }

      $extraLettersString = $stringB;

      if (strlen($missingLettersString) == 0 && strlen($extraLettersString) == 0)
      {
         return true;
      }

      return false;
   }

   /*
    *
    */
   private static function _removeSpacesAndPunctuation($string)
   {
      $newString = '';
      $strlen    = strlen($string);

      for ($i = 0; $i < $strlen; ++$i)
      {
         $char = $string[$i];

         if (ctype_punct($char) || ctype_space($char))
         {
            continue;
         }

         $newString .= $char;
      }

      return $newString;
   }

   /*
    *
    */
   private static function _throwLineFormatException($lineNoZeroBased, $message)
   {
      throw new Exception('Error detected at line ' . ($lineNoZeroBased + 1) . ".  $message");
   }
}

/*******************************************END*OF*FILE********************************************/
?>
