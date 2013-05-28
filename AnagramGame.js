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
   UTILS.checkArgs(f, arguments, ['string', 'positiveInt']);

   // Priviliged functions. /////////////////////////////////////////////////////////////////////

   this.getMainTable = function () {return _domElements.tables.main;}

   /*
    *
    */
   this.init = function ()
   {
      var f = 'AnagramGame.init()';
      UTILS.checkArgs(f, arguments, []);

      $('#next-clue-button').click
      (
         function (ev)
         {
            var nClues              = _state.currentClues.length;
            _state.currentClueIndex = (_state.currentClueIndex + 1) % nClues;

            $('#clue-td'       ).text(_state.currentClues[_state.currentClueIndex]          );
            $('#clue-number-td').text('Clue ' + (_state.currentClueIndex + 1) + '/' + nClues);
         }
      );

      $('#reveal-answer-button').click
      (
         function (ev)
         {
            _ajaxSend('give_up_and_get_answer', {currentQuestionIndex:_state.currentQuestionIndex});
         }
      );

      $('#next-question-button').click
      (
         function (ev)
         {
            _ajaxSend('get_next_question_info', {currentQuestionIndex:_state.currentQuestionIndex});
         }
      );

      $('#submit-answer-button').click
      (
         function (ev)
         {
            _ajaxSend
            (
               'submit_answer',
               {
                  currentQuestionIndex: _state.currentQuestionIndex,
                  submittedAnswer     : $(_inputs.textboxes.answer).val()
               }
            );
         }
      );

      $(_inputs.buttons.nextQuestion).hide();

      $.ajaxSetup
      (
         {
            dataType: 'json'             ,
            success : _receiveAjaxMessage,
            type    : 'POST'             ,
            url     : 'anagram_game_ajax.php'
         }
      );

      $('#next-question-button').click();
   };

   // Private functions. ////////////////////////////////////////////////////////////////////////

   /*
    * Game logic goes here.
    */
   function _receiveAjaxMessage(msg, XmlHttpRequest, ajaxOptions)
   {
      try
      {
         var f = 'AnagramGame._receiveAjaxMessage()';
         UTILS.checkArgs(f, arguments, ['object', 'string', 'object']);
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

   /*
    * Display code goes here in order to separate from game logic.
    */
   function _updateDisplay(header)
   {
      var f = 'AnagramGame._updateDisplay()';
      UTILS.checkArgs(f, arguments, ['string']);

      var displayTextByElementIdCamelCased = UTILS.switchAssign
      (
         header,
         {
            get_next_question_info:
            {
               answerLabelSpan : 'Answer'                              ,
               clueNumberTd    : 'Clue 1/' + _state.currentClues.length,
               clueTd          : _state.currentClues[0]                ,
               questionNumberTd: 'Question ' + (_state.currentQuestionIndex + 1) + '/' + nQuestions
            },
            give_up_and_get_answer:
            {
               answerLabelSpan: 'No answer given',
               clueNumberTd   : 'Answer'         ,
               clueTd         : _state.previousAnswer
            },
            submit_answer:
            {
               answerLabelSpan: (_state.boolPreviousGuessCorrect)? 'Correct!': 'Wrong!',
               clueNumberTd   : 'Answer'                                               ,
               clueTd         : _state.previousAnswer
            }
         }
      );

      for (var elementIdCamelCased in displayTextByElementIdCamelCased)
      {
         var elementId = UTILS.string.convertCamelCaseToHyphenated(elementIdCamelCased);
         $('#' + elementId).text(displayTextByElementIdCamelCased[elementIdCamelCased]);
      }

      if (header != 'get_next_question_info')
      {
         $('#score-td').text
         ('Score ' + _state.currentScore + '/' + (_state.currentQuestionIndex + 1));
      }
   }

   /*
    *
    */
   function _updateStateOfInputElements(header)
   {
      var f = 'AnagramGame._updateStateOfInputElements()';
      UTILS.checkArgs(f, arguments, ['string']);

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
   function _ajaxSend(header, payload)
   {
      var f = 'AnagramGame._ajaxSend()';
      UTILS.checkArgs(f, arguments, ['string', 'object']);

      $.ajax({data: JSON.stringify({header: header, payload: payload})});
   }

   /*
    *
    */
   function _displayEndGameSummary()
   {
      var f = 'AnagramGame._displayEndGameSummary()';
      UTILS.checkArgs(f, arguments, []);

      alert('Game over.  Final score ' + _state.currentScore + '/' + nQuestions);
   }

   // Private variables. ////////////////////////////////////////////////////////////////////////

   var _inputs =
   {
      buttons:
      {
         nextClue    : INPUT({type: 'button', id: 'next-clue-button'    , value: 'Next Clue'    }),
         nextQuestion: INPUT({type: 'button', id: 'next-question-button', value: 'Continue'     }),
         revealAnswer: INPUT({type: 'button', id: 'reveal-answer-button', value: 'Reveal Answer'}),
         submitAnswer: INPUT({type: 'button', id: 'submit-answer-button', value: 'Submit Answer'})
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
                  TD({style: 'width: 33%', id: 'question-number-td'}),
                  TD({style: 'width: 34%', id: 'score-td'          }),
                  TD({style: 'width: 33%', id: 'clue-number-td'    })
               ),
               TR({'class': 'clueTr'}, TD({colSpan: '3', id: 'clue-td'})),
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
