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

      $('#revealAnswerButton').click(_onClickRevealAnswerButton);
      $('#nextClueButton'    ).click(_onClickNextClueButton    );
      $('#submitAnswerButton').click(_onClickSubmitAnswerButton);

      $.ajaxSetup
      (
         {
            dataType: 'json'             ,
            success : _receiveAjaxMessage,
            type    : 'POST'             ,
            url     : 'anagram_game_ajax.php'
         }
      );

      $.ajax
      (
         {
            data: JSON.stringify
            (
               {
                  header : 'get_unanswered_question_info',
                  payload: {currentQuestionIndex: null}
               }
            )
         }
      );
   };

   // Private functions. ////////////////////////////////////////////////////////////////////////

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
         UTILS.validator.checkObject(msg, {header  : 'string', response: 'object'});

         var header   = msg.header;
         var response = msg.response;

         switch (header)
         {
          case 'get_unanswered_question_info':
            UTILS.validator.checkObject
            (response, {clues: 'nonEmptyArray', questionIndex: 'nonNegativeInt'});
            var clues         = response.clues;
            var questionIndex = response.questionIndex;
            $('#clueTd'      ).text(clues[0]                                            );
            $('#clueNoTd'    ).text('Clue 1/'   + clues.length                          );
            $('#questionNoTd').text('Question ' + (questionIndex + 1) + '/' + nQuestions);
            _state.currentQuestionIndex           = questionIndex;
            _state.currentClueIndex               = 0;
            _state.currentClues                   = clues;
            _inputs.buttons.nextClue.disabled     = (clues.length == 1);
            _inputs.buttons.submitAnswer.disabled = false;
            break;

          case 'give_up_and_get_answer':
            UTILS.validator.checkObject(response, {answer: 'string'});
            $('#clueNoTd').text('Answer'       );
            $('#clueTd'  ).text(response.answer);
            _inputs.buttons.submitAnswer.disabled = true;
            _inputs.buttons.nextClue.disabled     = true;
            break;

          case 'submit_answer':
            UTILS.validator.checkObject(response, {answer: 'string', boolCorrect: 'bool'});
            _inputs.buttons.submitAnswer.disabled = true;
            _inputs.buttons.nextClue.disabled     = true;
            $('#clueNoTd').text((response.boolCorrect)? 'Correct': 'Wrong');
            $('#clueTd'  ).text(response.answer);
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
         revealAnswer: INPUT({type: 'button', id: 'revealAnswerButton', value: 'Reveal Answer'}),
         nextClue    : INPUT({type: 'button', id: 'nextClueButton'    , value: 'Next Clue'    }),
         submitAnswer: INPUT({type: 'button', id: 'submitAnswerButton', value: 'Submit Answer'})
      },
      textboxes:
      {
         answer: INPUT({type: 'text'})
      }
   };

   var _domElements =
   {
      tables:
      {
         main: TABLE
         (
            TBODY
            (
               TR(TH({colspan: 3}, H1('Anagram Game'))),
               TR(TH({colspan: 3}, H2(topic         ))),
               TR
               (
                  TD({style: 'width: 33%', 'class': 'alignL', id: 'questionNoTd'}),
                  TD({style: 'width: 34%'                                       }),
                  TD({style: 'width: 33%', 'class': 'alignR', id: 'clueNoTd'    })
               ),
               TR(TD({colspan: '3', 'class': 'alignC', id: 'clueTd'}                          )),
               TR(TD({colspan: '3', 'class': 'alignC'              }, _inputs.textboxes.answer)),
               TR
               (
                  TD(_inputs.buttons.nextClue    ),
                  TD(_inputs.buttons.submitAnswer),
                  TD(_inputs.buttons.revealAnswer)
               )
            )
         )
      }
   };

   var _state =
   {
      currentClues        : null,
      currentClueIndex    : null,
      currentQuestionIndex: null
   };
}

/*******************************************END*OF*FILE********************************************/
