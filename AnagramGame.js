/**************************************************************************************************\
*
* vim: ts=3 sw=3 et wrap co=100 go -=b
*
* Filename: "AnagramGame.js"
*
* Project: Anagram Game.
*
* Purpose: Definition of the AnagramGame class.
*
* Author: Tom McDonnell 2012-05-20.
*
\**************************************************************************************************/

/*
 *
 */
function AnagramGame(topic, nQuestions)
{
   var f = 'AnagramGame()';
   UTILS.checkArgs(f, arguments, [String, 'positiveInt']);

   // Priviliged functions. /////////////////////////////////////////////////////////////////////

   this.getMainTable = function () {return _domElements.tables.main;}

   /*
    *
    */
   this.init = function ()
   {
      var buttons = _inputs.buttons;

      $('#revealAnswerButton').click(_onClickRevealAnswerButton           );
      $('#nextClueButton'    ).click(_onClickNextClueButton               );
      $('#submitAnswerButton').click(_onClickSubmitAnswerButton           );
      $('#nextQuestionButton').click(function () {_getNextQuestionInfo();});

      $(buttons.nextQuestion).hide();

      $.ajaxSetup
      (
         {
            dataType: 'json'             ,
            success : _receiveAjaxMessage,
            type    : 'POST'             ,
            url     : 'anagram_game_ajax.php'
         }
      );

      _getNextQuestionInfo();
   };

   // Private functions. ////////////////////////////////////////////////////////////////////////

   /*
    *
    */
   function _getNextQuestionInfo()
   {
      $.ajax
      (
         {
            data: JSON.stringify
            (
               {
                  header : 'get_next_question_info',
                  payload: {currentQuestionIndex: _state.currentQuestionIndex}
               }
            )
         }
      );
   }

   /*
    *
    */
   function _displayEndGameSummary()
   {
      alert('Game over.  Final score ' + _state.currentScore + '/' + nQuestions);
   }

   // Event listeners. ------------------------------------------------------------------------//

   /*
    *
    */
   function _onClickRevealAnswerButton(ev)
   {
      try
      {
         $.ajax
         (
            {
               data: JSON.stringify
               (
                  {
                     header : 'give_up_and_get_answer',
                     payload: {currentQuestionIndex: _state.currentQuestionIndex}
                  }
               )
            }
         );
      }
      catch (e)
      {
         console.debug(e);
      }
   }

   /*
    *
    */
   function _onClickNextClueButton(ev)
   {
      try
      {
         var currentClues     = _state.currentClues;
         var nClues           = currentClues.length;
         var currentClueIndex = (_state.currentClueIndex + 1) % nClues;

         $('#clueTd'  ).text(currentClues[currentClueIndex]                 );
         $('#clueNoTd').text('Clue ' + (currentClueIndex + 1) + '/' + nClues);

         _state.currentClueIndex = currentClueIndex;
      }
      catch (e)
      {
         console.debug(e);
      }
   }

   /*
    *
    */
   function _onClickSubmitAnswerButton(ev)
   {
      try
      {
         $.ajax
         (
            {
               data: JSON.stringify
               (
                  {
                     header : 'submit_answer',
                     payload:
                     {
                        currentQuestionIndex: _state.currentQuestionIndex,
                        submittedAnswer     : $(_inputs.textboxes.answer).val()
                     }
                  }
               )
            }
         );
      }
      catch (e)
      {
         console.debug(e);
      }
   }

   /*
    *
    */
   function _receiveAjaxMessage(msg, XmlHttpRequest, ajaxOptions)
   {
      try
      {
         UTILS.validator.checkObject(msg, {header: 'string', response: 'object'});

         var buttons   = _inputs.buttons;
         var textboxes = _inputs.textboxes;
         var header    = msg.header;
         var response  = msg.response;

         switch (header)
         {
          case 'get_next_question_info':
            UTILS.validator.checkObject
            (response, {clues: 'nullOrNonEmptyArray', questionIndex: 'nullOrNonNegativeInt'});
            if (response.questionIndex === null) {_displayEndGameSummary(); return;}
            var clues         = response.clues;
            var questionIndex = response.questionIndex;
            $('#answerLabelSpan'  ).text('Answer'                                            );
            $('#clueNoTd'         ).text('Clue 1/'   + clues.length                          );
            $('#clueTd'           ).text(clues[0]                                            );
            $('#questionNoTd'     ).text('Question ' + (questionIndex + 1) + '/' + nQuestions);
            $(buttons.nextQuestion).hide();
            $(buttons.submitAnswer).show();
            $(textboxes.answer    ).attr('value', '');
            _state.currentClueIndex       = 0;
            _state.currentClues           = clues;
            _state.currentQuestionIndex   = questionIndex;
            buttons.nextClue.disabled     = (clues.length == 1);
            buttons.revealAnswer.disabled = false;
            buttons.submitAnswer.disabled = false;
            textboxes.answer.disabled     = false;
            break;

          case 'give_up_and_get_answer':
            UTILS.validator.checkObject(response, {answer: 'string'});
            $('#answerLabelSpan'  ).text('No answer given');
            $('#clueNoTd'         ).text('Answer'         );
            $('#clueTd'           ).text(response.answer  );
            $('#scoreTd'          ).text
            ('Score ' + _state.currentScore + '/' + (_state.currentQuestionIndex + 1));
            $(buttons.nextQuestion).show();
            $(buttons.submitAnswer).hide();
            buttons.nextClue.disabled     = true;
            buttons.revealAnswer.disabled = true;
            buttons.submitAnswer.disabled = true;
            textboxes.answer.disabled     = true;
            break;

          case 'submit_answer':
            UTILS.validator.checkObject(response, {answer: 'string', boolCorrect: 'bool'});
            _state.currentScore += (response.boolCorrect)? 1: 0;
            $('#answerLabelSpan'  ).text((response.boolCorrect)? 'Correct!': 'Wrong!');
            $('#clueNoTd'         ).text('Answer'                                    );
            $('#clueTd'           ).text(response.answer                             );
            $('#scoreTd'          ).text
            ('Score ' + _state.currentScore + '/' + (_state.currentQuestionIndex + 1));
            $(buttons.nextQuestion).show();
            $(buttons.submitAnswer).hide();
            buttons.nextClue.disabled     = true;
            buttons.revealAnswer.disabled = true;
            buttons.submitAnswer.disabled = true;
            textboxes.answer.disabled     = true;
            break;

          default:
            throw 'Unknown header "' + header + '".';
         }
      }
      catch (e)
      {
         console.debug(e);
      }
   }

   // Private variables. ////////////////////////////////////////////////////////////////////////

   var _inputs =
   {
      buttons:
      {
         nextClue    : INPUT({type: 'button', id: 'nextClueButton'    , value: 'Next Clue'    }),
         nextQuestion: INPUT({type: 'button', id: 'nextQuestionButton', value: 'Continue'     }),
         revealAnswer: INPUT({type: 'button', id: 'revealAnswerButton', value: 'Reveal Answer'}),
         submitAnswer: INPUT({type: 'button', id: 'submitAnswerButton', value: 'Submit Answer'})
      },
      textboxes:
      {
         answer: INPUT({type: 'text', id: 'answerTextbox'})
      }
   };

   var _domElements =
   {
      tables:
      {
         main: TABLE
         (
            {id: 'anagramGameTable'},
            TBODY
            (
               TR
               (
                  {'class': 'instructionsTr'},
                  TD
                  (
                     {colSpan: '3'},
                     'Rearrange the letters in the phrase below to form the', BR(),
                     ' name of a ' + topic
                  )
               ),
               TR
               (
                  {'class': 'questionNoTr'},
                  TD({style: 'width: 33%', id: 'questionNoTd'}),
                  TD({style: 'width: 34%', id: 'scoreTd'     }),
                  TD({style: 'width: 33%', id: 'clueNoTd'    })
               ),
               TR({'class': 'clueTr'}, TD({colSpan: '3', id: 'clueTd'})),
               TR
               (
                  {'class': 'answerTr'},
                  TD
                  (
                     {colSpan: '3'}, SPAN({id: 'answerLabelSpan'}), BR(), _inputs.textboxes.answer
                  )
               ),
               TR
               (
                  {'class': 'buttonsTr'},
                  TD(_inputs.buttons.nextClue                                  ),
                  TD(_inputs.buttons.submitAnswer, _inputs.buttons.nextQuestion),
                  TD(_inputs.buttons.revealAnswer                              )
               )
            )
         )
      }
   };

   var _state =
   {
      currentClueIndex    : null,
      currentClues        : null,
      currentQuestionIndex: null,
      currentScore        : 0
   };
}

/*******************************************END*OF*FILE********************************************/
