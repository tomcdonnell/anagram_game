/**************************************************************************************************\
*
* vim: ts=3 sw=3 et wrap co=100 go -=b
*
* Filename: "index.js"
*
* Project: Anagram Game.
*
* Purpose: Starting point for javascripts.
*
* Author: Tom McDonnell 2012-05-20.
*
\**************************************************************************************************/

$(document).ready
(
   function (ev)
   {
      try
      {
         var anagramGame = new AnagramGame
         (
                   $('input[name="topic"]'     ).val(),
            Number($('input[name="nQuestions"]').val())
         );

         $('body').append(anagramGame.getMainTable());

         anagramGame.init();
      }
      catch (e)
      {
         console.debug(e);
      }
   }
);

/*******************************************END*OF*FILE********************************************/
