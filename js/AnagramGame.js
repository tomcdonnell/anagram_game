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

   // Public functions. /////////////////////////////////////////////////////////////////////////

   this.getMainTable = function () {return _domElements.tables.main;}

   /*
    *
    */
   this.init = function ()
   {
      var f = 'AnagramGame.init()';
      UTILS.checkArgs(f, arguments, []);

      var buttons = _inputs.buttons;

      for (var buttonName in buttons)
      {
         $(buttons[buttonName]).click(_onClickButton);
      }

      $(buttons.nextQuestion).hide();

      $.ajaxSetup
      (
         {
            dataType: 'json'             ,
            success : _receiveAjaxMessage,
            type    : 'POST'             ,
            url     : 'php/anagram_game_ajax.php'
         }
      );

      $(buttons.nextQuestion).click();
   };

   // Private functions. ////////////////////////////////////////////////////////////////////////

   /*
    *
    */
   function _onClickButton(ev)
   {
      try
      {
         var f = 'AnagramGame._onClickButton()';
         UTILS.checkArgs(f, arguments, ['Object']);

         var buttons = _inputs.buttons;

         switch (ev.target)
         {
          case buttons.autoplayWithAnswers:
            _state.autoplayMode = 'withAnswers';
            _autoplayWithAnswers();
            break;

          case buttons.autoplayWithoutAnswers:
            _state.autoplayMode = 'withoutAnswers';
            _autoplayWithoutAnswers();
            break;

          case buttons.nextClue:
            $('input[type="button"]').prop('disabled', true);
            var nClues      = _state.currentClues.length;
            var clueTdJq    = $('#clue-td');
            _state.currentClueIndex = (_state.currentClueIndex + 1) % nClues;
            var newClueText = _state.currentClues[_state.currentClueIndex];
            _anagramGameTransitioner.transitionAnagramElement
            (
               clueTdJq[0], newClueText, function ()
               {
                  $('#clue-number-td').text('Clue ' + (_state.currentClueIndex + 1) + '/' + nClues);
                  _updateClueTd(newClueText);
                  _updateStateOfInputElements('get_next_question_info');
               }
            );
            break;

          case buttons.revealAnswer:
            $('input[type="button"]').prop('disabled', true);
            _ajaxSend('give_up_and_get_answer', {currentQuestionIndex:_state.currentQuestionIndex});
            break;

          case buttons.nextQuestion:
            _ajaxSend('get_next_question_info', {currentQuestionIndex:_state.currentQuestionIndex});
            break;

          case buttons.submitAnswer:
            _ajaxSend
            (
               'submit_answer',
               {
                  currentQuestionIndex: _state.currentQuestionIndex,
                  submittedAnswer     : $(_inputs.textboxes.answer).val()
               }
            );
            break;

          default:
            throw new Exception(f, 'Unexpected button click detected.');
         }
      }
      catch (e)
      {
         UTILS.printExceptionToConsole(f, e);
      }
   }

   /*
    *
    */
   function _autoplayWithAnswers()
   {
      var f = 'AnagramGame._autoplayWithAnswers()';
      UTILS.checkArgs(f, arguments, []);

      var boolLastClueDisplayed = (_state.currentClueIndex == _state.currentClues.length - 1);
      var boolAnswerDisplayed   = ($('#clue-number-td').html() == 'Answer');

      window.setTimeout
      (
         function ()
         {
            try
            {
               var f = 'AnagramGame._autoplayWithAnswers() onTimeout()';
               UTILS.checkArgs(f, arguments, []);

               var buttons  = _inputs.buttons;
               var clueTdJq = $('#clue-td');

               if (boolAnswerDisplayed)
               {
                  clueTdJq.css('color', 'red');
                  clueTdJq.html
                  (
                     (_state.currentQuestionIndex + 1 == nQuestions)? 'Game Over':
                     'Question ' + (_state.currentQuestionIndex + 2)
                  );
                  window.setTimeout(function () {$(buttons.nextQuestion).click();}, 1000);
               }
               else
               {
                  $((boolLastClueDisplayed)? buttons.revealAnswer: buttons.nextClue).click();
               }
            }
            catch (e)
            {
               UTILS.printExceptionToConsole(f, e);
            }
         },
         ((boolAnswerDisplayed)? 1500: 300)
      );
   }

   /*
    *
    */
   function _autoplayWithoutAnswers()
   {
      var f = 'AnagramGame._autoplayWithoutAnswers()';
      UTILS.checkArgs(f, arguments, []);

      var boolLastClueDisplayed = (_state.currentClueIndex == _state.currentClues.length - 1);

      window.setTimeout
      (
         function ()
         {
            try
            {
               var f = 'AnagramGame._autoplayWithAnswers() onTimeout()';
               UTILS.checkArgs(f, arguments, []);

               var buttons  = _inputs.buttons;
               var clueTdJq = $('#clue-td');

               if (boolLastClueDisplayed)
               {
                  clueTdJq.css('color', 'red');
                  clueTdJq.html
                  (
                     (_state.currentQuestionIndex + 1 == nQuestions)? 'Game Over':
                     'Question ' + (_state.currentQuestionIndex + 2)
                  );
                  window.setTimeout(function () {$(buttons.nextQuestion).click();}, 1000);
               }
               else
               {
                  $(buttons.nextClue).click();
               }
            }
            catch (e)
            {
               UTILS.printExceptionToConsole(f, e);
            }
         },
         2000
      );
   }

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
            $('#clue-td').html('');
            _updateDisplay(header);
            _updateStateOfInputElements(header);
            break;

          case 'give_up_and_get_answer':
            UTILS.validator.checkObject(response, {answer: 'string'});
            _state.previousAnswer           = response.answer;
            _state.boolPreviousGuessCorrect = false;
            _anagramGameTransitioner.transitionAnagramElement
            (
               $('#clue-td')[0], response.answer, function ()
               {
                  _updateDisplay(header);
                  _updateStateOfInputElements(header);
               }
            );
            break;

          case 'submit_answer':
            UTILS.validator.checkObject(response, {answer: 'string', boolCorrect: 'bool'});
            _state.currentScore            += (response.boolCorrect)? 1: 0;
            _state.previousAnswer           = response.answer;
            _state.boolPreviousGuessCorrect = response.boolCorrect;
            _anagramGameTransitioner.transitionAnagramElement
            (
               $('#clue-td')[0], response.answer, function ()
               {
                  _updateDisplay(header);
                  _updateStateOfInputElements(header);
               }
            );
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
         var displayText = displayTextByElementIdCamelCased[elementIdCamelCased]
         var elementId   = UTILS.string.convertCamelCaseToHyphenated(elementIdCamelCased);
         var elementJq   = $('#' + elementId);

         if (elementId == 'clue-td')
         {
            _updateClueTd(displayText);
            continue;
         }

         elementJq.text(displayText);
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
   function _updateClueTd(displayText)
   {
      var f = 'AnagramGame._updateClueTd()';
      UTILS.checkArgs(f, arguments, ['string']);

      var clueTdJq = $('#clue-td');

      clueTdJq.html('');

      $('#clue-td').css('color', (($('#clue-number-td').html() == 'Answer')? 'green': 'black'));

      for (var i = 0, len = displayText.length; i < len; ++i)
      {
         clueTdJq.append(SPAN(displayText[i]));
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

      if (_state.autoplayMode === null)
      {
         $(buttons.autoplayWithoutAnswers).prop('disabled', false);
         $(buttons.autoplayWithAnswers   ).prop('disabled', false);
         $(buttons.nextQuestion          ).prop('disabled', false);

         switch (header)
         {
          case 'get_next_question_info':
            $(buttons.nextQuestion).hide();
            $(buttons.submitAnswer).show();
            $(textboxes.answer    ).attr('value', '');
            $(buttons.nextClue    ).prop('disabled', (_state.currentClues.length == 1));
            $(buttons.revealAnswer).prop('disabled', false                            );
            $(buttons.submitAnswer).prop('disabled', false                            );
            $(textboxes.answer    ).prop('disabled', false                            );
            break;

          case 'give_up_and_get_answer': // Fall through.
          case 'submit_answer'         :
            $(buttons.nextQuestion).show();
            $(buttons.submitAnswer).hide();
            $(buttons.nextClue    ).prop('disabled', true );
            $(buttons.revealAnswer).prop('disabled', true );
            $(buttons.submitAnswer).prop('disabled', true );
            $(textboxes.answer    ).prop('disabled', true );
            break;

          default:
            throw 'Unknown header "' + header + '".';
         }
      }
      else
      {
         switch (_state.autoplayMode)
         {
          case 'withAnswers'   : _autoplayWithAnswers()   ; break;
          case 'withoutAnswers': _autoplayWithoutAnswers(); break;
          default: throw new Exception(f, 'Unknown autoplay mode "' + _state.autoplayMode + '".');
         }
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

   var _anagramGameTransitioner = new AnagramGameTransitioner();

   var _inputs =
   {
      buttons:
      {
         autoplayWithAnswers: INPUT
         (
            {type: 'button', id: 'autoplay-with-answers' , value: 'Autoplay with Answers'}
         ),
         autoplayWithoutAnswers: INPUT
         (
            {type: 'button', id: 'autoplay-without-answers' , value: 'Autoplay without Answers'}
         ),
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
            {id: 'anagram-game-table'},
            TBODY
            (
               TR
               (
                  {'class': 'instructions-tr'},
                  TD
                  (
                     {colSpan: '3'},
                     'Rearrange the letters in the phrase below to form the', BR(),
                     ' name of a ' + topic, BR(), BR(),
                     _inputs.buttons.autoplayWithoutAnswers,
                     _inputs.buttons.autoplayWithAnswers
                  )
               ),
               TR
               (
                  {'class': 'question-number-tr'},
                  TD({style: 'width: 33%', id: 'question-number-td'}),
                  TD({style: 'width: 34%', id: 'score-td'          }),
                  TD({style: 'width: 33%', id: 'clue-number-td'    })
               ),
               TR({'class': 'clue-tr'}, TD({colSpan: '3', id: 'clue-td'})),
               TR
               (
                  {'class': 'answer-tr'},
                  TD
                  (
                     {colSpan: '3'}, SPAN({id: 'answer-label-span'}), BR(), _inputs.textboxes.answer
                  )
               ),
               TR
               (
                  {'class': 'buttons-tr'},
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
      autoplayMode        : null,
      currentClueIndex    : null,
      currentClues        : null,
      currentQuestionIndex: null,
      currentScore        : 0
   };
}

/*******************************************END*OF*FILE********************************************/
