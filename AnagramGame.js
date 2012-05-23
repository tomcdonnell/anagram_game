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
   UTILS.checkArgs('AnagramGame()', arguments, [String, 'positiveInt']);

   // Priviliged functions. /////////////////////////////////////////////////////////////////////

   this.getMainTable = function () {return _domElements.tables.main;}

   /*
    *
    */
   this.init = function ()
   {
      var getNextQuestionInfoFunction = function ()
      {
         _sendAjaxMessage
         (
            'get_next_question_info', {currentQuestionIndex: _state.currentQuestionIndex}
         );
      };

      var buttons = _inputs.buttons;

      $('#revealAnswerButton').click(_onClickRevealAnswerButton                  );
      $('#nextClueButton'    ).click(_onClickNextClueButton                      );
      $('#submitAnswerButton').click(_onClickSubmitAnswerButton                  );
      $('#nextQuestionButton').click(function () {getNextQuestionInfoFunction();});

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

      getNextQuestionInfoFunction();
   };

   // Private functions. ////////////////////////////////////////////////////////////////////////

   // Event listeners. ------------------------------------------------------------------------//

   /*
    *
    */
   function _onClickNextClueButton(ev)
   {
      try
      {
         var nClues              = _state.currentClues.length;
         _state.currentClueIndex = (_state.currentClueIndex + 1) % nClues;

         $('#clueTd'  ).text(_state.currentClues[_state.currentClueIndex]          );
         $('#clueNoTd').text('Clue ' + (_state.currentClueIndex + 1) + '/' + nClues);
      }
      catch (e)
      {
         console.debug(e);
      }
   }

   /*
    *
    */
   function _onClickRevealAnswerButton(ev)
   {
      try
      {
         _sendAjaxMessage
         (
            'give_up_and_get_answer', {currentQuestionIndex: _state.currentQuestionIndex}
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
   function _onClickSubmitAnswerButton(ev)
   {
      try
      {
         _sendAjaxMessage
         (
            'submit_answer',
            {
               currentQuestionIndex: _state.currentQuestionIndex,
               submittedAnswer     : $(_inputs.textboxes.answer).val()
            }
         );
      }
      catch (e)
      {
         console.debug(e);
      }
   }

   /*
    * Game logic goes here.
    */
   function _receiveAjaxMessage(msg, XmlHttpRequest, ajaxOptions)
   {
      try
      {
         UTILS.validator.checkObject(msg, {header: 'string', response: 'object'});

         var header   = msg.header;
         var response = msg.response;

         switch (header)
         {
          case 'get_next_question_info':
            UTILS.validator.checkObject
            (response, {clues: 'nullOrNonEmptyArray', questionIndex: 'nullOrNonNegativeInt'});
            if (response.questionIndex === null) {_displayEndGameSummary(); return;}
            _state.currentClueIndex     = 0;
            _state.currentClues         = response.clues;
            _state.currentQuestionIndex = response.questionIndex;
            break;

          case 'give_up_and_get_answer':
            UTILS.validator.checkObject(response, {answer: 'string'});
            _state.previousAnswer           = response.answer;
            _state.boolPreviousGuessCorrect = false;
            break;

          case 'submit_answer':
            UTILS.validator.checkObject(response, {answer: 'string', boolCorrect: 'bool'});
            _state.currentScore            += (response.boolCorrect)? 1: 0;
            _state.previousAnswer           = response.answer;
            _state.boolPreviousGuessCorrect = response.boolCorrect;
            break;

          default:
            throw 'Unknown header "' + header + '".';
         }

         _updateDisplay(header);
         _updateStateOfInputElements(header);
      }
      catch (e)
      {
         console.debug(e);
      }
   }

   // Other private functions. ----------------------------------------------------------------//

   /*
    * Display code goes here in order to separate from game logic.
    */
   function _updateDisplay(header)
   {
      var displayTextByElementId = UTILS.switchAssign
      (
         header,
         {
            get_next_question_info:
            {
               answerLabelSpan: 'Answer'                              ,
               clueNoTd       : 'Clue 1/' + _state.currentClues.length,
               clueTd         : _state.currentClues[0]                ,
               questionNoTd   : 'Question ' + (_state.currentQuestionIndex + 1) + '/' + nQuestions
            },
            give_up_and_get_answer:
            {
               answerLabelSpan: 'No answer given',
               clueNoTd       : 'Answer'         ,
               clueTd         : _state.previousAnswer
            },
            submit_answer:
            {
               answerLabelSpan: (_state.boolPreviousGuessCorrect)? 'Correct!': 'Wrong!',
               clueNoTd       : 'Answer'                                               ,
               clueTd         : _state.previousAnswer
            }
         }
      );

      for (var key in displayTextByElementId)
      {
         $('#' + key).text(displayTextByElementId[key]);
      }

      if (header != 'get_next_question_info')
      {
         $('#scoreTd').text
         ('Score ' + _state.currentScore + '/' + (_state.currentQuestionIndex + 1));
      }
   }

   /*
    *
    */
   function _updateStateOfInputElements(header)
   {
      var buttons   = _inputs.buttons;
      var textboxes = _inputs.textboxes;

      switch (header)
      {
       case 'get_next_question_info':
         $(buttons.nextQuestion).hide();
         $(buttons.submitAnswer).show();
         $(textboxes.answer    ).attr('value', '');
         buttons.nextClue.disabled     = (_state.currentClues.length == 1);
         buttons.revealAnswer.disabled = false;
         buttons.submitAnswer.disabled = false;
         textboxes.answer.disabled     = false;
         break;

       case 'give_up_and_get_answer': // Fall through.
       case 'submit_answer'         :
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

   /*
    *
    */
   function _sendAjaxMessage(header, payload)
   {
      $.ajax({data: JSON.stringify({header: header, payload: payload})});
   }

   /*
    *
    */
   function _displayEndGameSummary()
   {
      alert('Game over.  Final score ' + _state.currentScore + '/' + nQuestions);
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
