<?php
/**************************************************************************************************\
*
* vim: ts=3 sw=3 et wrap co=100 go -=b
*
* Filename: "anagram_game_ajax.php"
*
* Project: Anagram Game.
*
* Purpose: Server-side AJAX.
*
* Author: Tom McDonnell 2012-05-20.
*
\**************************************************************************************************/

// Settings. ///////////////////////////////////////////////////////////////////////////////////////

session_start();

// Includes. ///////////////////////////////////////////////////////////////////////////////////////

require_once dirname(__FILE__) . '/lib_tom/php/utils/UtilsValidator.php';

// Globally executed code. /////////////////////////////////////////////////////////////////////////

try
{
   $msg = json_decode(file_get_contents('php://input'), true);

   UtilsValidator::checkType($msg, 'array');
   UtilsValidator::checkArray($msg, array('header' => 'string', 'payload' => 'array'));
   extract($msg);

   switch ($header)
   {
    case 'get_unanswered_question_info':
      $response = getResponseForGetUnansweredQuestionInfoQuery($payload);
      break;

    case 'give_up_and_get_answer':
      $response = getResponseForGiveUpAndGetAnswerQuery($payload);
      break;

    case 'submit_answer':
      $response = getResponseForSubmitAnswerQuery($payload);
      break;

    default:
      throw new Exception("Unknown header '$header'.");
   }

   echo json_encode(array('header' => $header, 'response' => $response));
}
catch (Exception $e)
{
   echo $e->getMessage();
}

// Functions. //////////////////////////////////////////////////////////////////////////////////////

/*
 *
 */
function getResponseForGetUnansweredQuestionInfoQuery($payload)
{
   UtilsValidator::checkArray($payload, array('currentQuestionIndex' => 'nullOrNonNegativeInt'));
   extract($payload);

   assertAnagramGameSessionArrayIsValid($_SESSION['anagramGame']);
   extract($_SESSION['anagramGame']);

   $nQuestions        = count($answersInQuestionOrder);
   $nextQuestionIndex =
   (
      ($currentQuestionIndex === null)? 0: ($currentQuestionIndex + 1) % $nQuestions
   );

   $nextAnswer = $answersInQuestionOrder[$nextQuestionIndex];

   while (array_key_exists($nextAnswer, $answerSubmittedByAnswer))
   {
      $nextQuestionIndex = ($nextQuestionIndex + 1) % $nQuestions;
      $nextAnswer        = $answersInQuestionOrder[$nextQuestionIndex];
   }

   return array
   (
      'questionIndex' => $nextQuestionIndex,
      'clues'         => $anagramsByAnswer[$nextAnswer]
   );
}

/*
 *
 */
function getResponseForGiveUpAndGetAnswerQuery($payload)
{
   UtilsValidator::checkArray($payload, array('currentQuestionIndex' => 'nonNegativeInt'));
   extract($payload);

   assertAnagramGameSessionArrayIsValid($_SESSION['anagramGame']);
   extract($_SESSION['anagramGame']);

   $answer = $answersInQuestionOrder[$currentQuestionIndex];
   $_SESSION['anagramGame']['answerSubmittedByAnswer'][$answer] = null;

   return array('answer' => $answer);
}

/*
 *
 */
function getResponseForSubmitAnswerQuery($payload)
{
   UtilsValidator::checkArray
   (
      $payload, array('currentQuestionIndex' => 'nonNegativeInt', 'submittedAnswer' => 'string')
   );
   extract($payload);

   assertAnagramGameSessionArrayIsValid($_SESSION['anagramGame']);
   extract($_SESSION['anagramGame']);

   $answer = $answersInQuestionOrder[$currentQuestionIndex];
   $_SESSION['anagramGame']['answerSubmittedByAnswer'][$answer] = $submittedAnswer;

   return array('answer' => $answer, 'boolCorrect' => ($answer == $submittedAnswer));
}

/*
 *
 */
function assertAnagramGameSessionArrayIsValid($array)
{
   UtilsValidator::checkType($array, 'array');
   UtilsValidator::checkArray
   (
      $array, array
      (
         'anagramsByAnswer'        => 'array',
         'answersInQuestionOrder'  => 'array',
         'answerSubmittedByAnswer' => 'array',
         'topic'                   => 'string'
      )
   );
}

/*******************************************END*OF*FILE********************************************/
?>
