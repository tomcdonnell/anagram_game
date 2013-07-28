<?php
/**************************************************************************************************\
*
* vim: ts=3 sw=3 et wrap co=100 go -=b
*
* Filename: "index.php"
*
* Project: Anagram Game.
*
* Purpose: The main file for the project.
*
* Author: Tom McDonnell 2010-11-16.
*
\**************************************************************************************************/

// Includes. ///////////////////////////////////////////////////////////////////////////////////////

require_once dirname(__FILE__) . '/../../lib/tom/php/utils/UtilsHtml.php';
require_once dirname(__FILE__) . '/../../lib/tom/php/utils/UtilsHtmlForm.php';
require_once dirname(__FILE__) . '/php/AnagramGameParser.php';

// Settings. ///////////////////////////////////////////////////////////////////////////////////////

session_start();

// Globally executed code. /////////////////////////////////////////////////////////////////////////

try
{
   $gameDataFilename = dirname(__FILE__) . '/game_data/dpi_colleagues.txt';

   list($topic, $anagramsByAnswer) = AnagramGameParser::parseGameData($gameDataFilename);

   $answersInQuestionOrder = array_keys($anagramsByAnswer);
   //shuffle($answersInQuestionOrder);

   $_SESSION['anagramGame'] = array
   (
      'anagramsByAnswer'        => $anagramsByAnswer      ,
      'answersInQuestionOrder'  => $answersInQuestionOrder,
      'answerSubmittedByAnswer' => array()                ,
      'topic'                   => $topic
   );

   $anchorHtmlStrings = array
   (
      // Order important.
      "<a href='http://www.tomcdonnell.net/small_apps/anagram_checker'>Anagram Checker</a>",
      "<strong>Anagram Game</strong>",
      "<a href='http://www.tomcdonnell.net/small_apps/anagram_finder'>Anagram Finder</a>"
   );
}
catch (Exception $e)
{
   echo $e->getMessage();
   die;
}

// HTML code. //////////////////////////////////////////////////////////////////////////////////////
?>
<!DOCTYPE html>
<html>
 <head>
  <title>Anagram Game</title>
<?php
UtilsHtml::echoHtmlScriptAndLinkTagsForJsAndCssFiles
(
   array
   (
      'lib_tom/css/general_styles.css',
      'css/styles.css'
   ),
   array
   (
      // NOTE: Order important.
      '../../lib/tom/js/contrib/jquery/1.7/jquery_minified.js',
      '../../lib/tom/js/contrib/utils/DomBuilder.js'          ,
      '../../lib/tom/js/utils/utils.js'                       ,
      '../../lib/tom/js/utils/utilsObject.js'                 ,
      '../../lib/tom/js/utils/utilsString.js'                 ,
      '../../lib/tom/js/utils/utilsValidator.js'              ,
      'js/AnagramGame.js'                                     ,
      'js/AnagramGameTransitioner.js'                         ,
      'js/index.js'
   )
);
?>
 </head>
 <body>
  <div id='links-div'>
   <a href='http://www.tomcdonnell.net'>Back to tomcdonnell.net</a>
   <br/><br/>
<?php
echo '   ', implode(" |\n   ", $anchorHtmlStrings), "\n";
UtilsHtmlForm::echoArrayAsHiddenInputs
(
   array
   (
      'topic'      => $topic,
      'nQuestions' => count($answersInQuestionOrder)
   ), '   '
);
?>
  </div>
 </body>
</html>
<?php
/*******************************************END*OF*FILE********************************************/
?>
