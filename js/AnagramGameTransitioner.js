/**************************************************************************************************\
*
* vim: ts=3 sw=3 et wrap co=100 go -=b
*
* Filename: "AnagramGameTransitioner.js"
*
* Project: Anagram Game.
*
* Purpose: Definition of the AnagramGameTransitioner class.
*
* Author: Tom McDonnell 2013-06-01.
*
\**************************************************************************************************/

/*
 *
 */
function AnagramGameTransitioner()
{
   var f = 'AnagramGameTransitioner()';
   UTILS.checkArgs(f, arguments, []);

   // Public functions. /////////////////////////////////////////////////////////////////////////

   /*
    *
    */
   this.transitionAnagramElement = function (containerElement, clueTextNew, onCompleteFunction)
   {
      var f = 'AnagramGameTransitioner.transitionAnagramElement()';
      UTILS.checkArgs(f, arguments, ['Defined', 'string', 'function']);

      _containerElementJq = $(containerElement);
      _onCompleteFunction = onCompleteFunction;

      if (_containerElementJq.html() == '')
      {
         for (var i = 0, len = clueTextNew.length; i < len; ++i)
         {
            _containerElementJq.append(SPAN(clueTextNew[i]));
         }

         return;
      }

      var clueTextOldLowerCase = _removeNonAlphaClueCharactersFromDomAndConvertToLowerCase();
      var clueTextNewLowerCase = _removeNonAlphaCharactersFromString(clueTextNew).toLowerCase();
      var newIndexByOldIndex   = _getNewIndexByOldIndex
      (
         clueTextOldLowerCase, clueTextNewLowerCase
      );

      _convertClueCharactersToBeAbsolutelyPositioned();

      _offsetByIndexByFrameNo = _getOffsetByIndexByFrameNo(newIndexByOldIndex);
      _frameNo                = 0;

      window.setTimeout
      (
         _updateOffsetsOfAbsolutelyPositionedCharacters,
         _TRANSITION_TIME_IN_MS / _N_FRAMES_PER_TRANSITION
      );
   };

   // Private functions. ////////////////////////////////////////////////////////////////////////

   /*
    *
    */
   function _updateOffsetsOfAbsolutelyPositionedCharacters()
   {
      var f = 'AnagramGameTransitioner._updateOffsetsOfAbsolutelyPositionedCharacters()';
      UTILS.checkArgs(f, arguments, []);

      var children      = _containerElementJq.children();
      var nLetters      = children.length;
      var offsetByIndex = _offsetByIndexByFrameNo[_frameNo];

      for (var i = 0; i < nLetters; ++i)
      {
         var offset = offsetByIndex[i];
         $(children[i]).css('left', offset.left);
         $(children[i]).css('top' , offset.top );
      }

      ++_frameNo;

      if (_frameNo <= _N_FRAMES_PER_TRANSITION)
      {
         window.setTimeout
         (
            _updateOffsetsOfAbsolutelyPositionedCharacters,
            _TRANSITION_TIME_IN_MS / _N_FRAMES_PER_TRANSITION
         );
      }
      else
      {
         if (_onCompleteFunction !== null)
         {
            _onCompleteFunction();
         }
      }
   }

   /*
    *
    */
   function _getOffsetByIndexByFrameNo(newIndexByOldIndex)
   {
      var f = 'AnagramGameTransitioner._getOffsetByIndexByFrameNo()';
      UTILS.checkArgs(f, arguments, ['array']);

      var nLetters                        = newIndexByOldIndex.length;
      var children                        = _containerElementJq.children();
      var offsetFunctionsOfFrameNoByIndex = [];
      var offsetByIndexByFrameNo          = [];

      for (var i = 0; i < nLetters; ++i)
      {
         var oldIndex            = i;
         var newIndex            = newIndexByOldIndex[oldIndex];
         var offsetAtOldPosition = $(children[oldIndex]).offset();
         var offsetAtNewPosition = $(children[newIndex]).offset();
         var xOld                = offsetAtOldPosition.left;
         var xNew                = offsetAtNewPosition.left;
         var circleR             = Math.abs(xNew - xOld) / 2;
         var circleX             = ((xNew > xOld)? xOld: xNew) + circleR;
         var circleY             = offsetAtOldPosition.top;
         var sign                = (xOld > xNew)? '+': '-';

         var leftFunctionString = circleX + ' + ' + circleR + ' * ' +
         (
            sign + 'Math.cos((Math.PI * frameNo) / ' + _N_FRAMES_PER_TRANSITION + ')'
         );

         var topFunctionString = circleY + ' + ' + circleR + ' * ' +
         (
            sign + 'Math.sin((Math.PI * frameNo) / ' + _N_FRAMES_PER_TRANSITION + ')'
         );

         var evalStr =
         (
            'offsetFunctionsOfFrameNoByIndex[i] =\n' +
            '{\n'                                    +
            '   left: function (frameNo) {return '   + leftFunctionString + ';},\n' +
            '   top : function (frameNo) {return '   + topFunctionString  + ';}\n'  +
            '};'
         );

         eval(evalStr);
      }

      for (var frameNo = 0; frameNo <= _N_FRAMES_PER_TRANSITION; ++frameNo)
      {
         offsetByIndexByFrameNo[frameNo] = [];
      }

      for (var i = 0; i < nLetters; ++i)
      {
         var offsetFunctionsOfFrameNo = offsetFunctionsOfFrameNoByIndex[i];

         for (var frameNo = 0; frameNo <= _N_FRAMES_PER_TRANSITION; ++frameNo)
         {
            offsetByIndexByFrameNo[frameNo][i] =
            {
               'left': offsetFunctionsOfFrameNo.left(frameNo),
               'top' : offsetFunctionsOfFrameNo.top(frameNo)
            };
         }
      }

      return offsetByIndexByFrameNo;
   }

   /*
    *
    */
   function _convertClueCharactersToBeAbsolutelyPositioned()
   {
      var f = 'AnagramGameTransitioner._convertClueCharactersToBeAbsolutelyPositioned()';
      UTILS.checkArgs(f, arguments, []);

      var children      = _containerElementJq.children();
      var offsetByIndex = [];

      for (var i = 0, len = children.length; i < len; ++i)
      {
         offsetByIndex.push($(children[i]).offset());
      }

      for (var i = 0, len = children.length; i < len; ++i)
      {
         var offset = offsetByIndex[i];
         $(children[i]).css({'position': 'absolute', 'left': offset.left, 'top': offset.top});
      }
   }

   /*
    *
    */
   function _getNewIndexByOldIndex(clueTextOldLowerCase, clueTextNewLowerCase)
   {
      var f = 'AnagramGameTransitioner._getNewIndexByOldIndex()';
      UTILS.checkArgs(f, arguments, ['string', 'string']);

      if (clueTextOldLowerCase.length != clueTextNewLowerCase.length)
      {
         throw new Exception(f, 'New/old clue length mismatch.');
      }

      var newIndexByOldIndex    = [];
      var nAlreadyFoundByLetter = {};

      for (var i = 0, len = clueTextOldLowerCase.length; i < len; ++i)
      {
         var letter        = clueTextOldLowerCase[i];
         var nAlreadyFound =
         (
            (nAlreadyFoundByLetter[letter] === undefined)? 0: nAlreadyFoundByLetter[letter]
         );

         var newIndex = _findIndexOfNthOccurranceOfCharacter
         (
            clueTextNewLowerCase, nAlreadyFound + 1, letter
         );

         if (nAlreadyFoundByLetter[letter] === undefined)
         {
            nAlreadyFoundByLetter[letter] = 0;
         }

         ++nAlreadyFoundByLetter[letter];

         newIndexByOldIndex[i] = newIndex;
      }

      return newIndexByOldIndex;
   }

   /*
    *
    */
   function _findIndexOfNthOccurranceOfCharacter(str, n, character)
   {
      var f = 'AnagramGameTransitioner._findIndexOfNthOccurranceOfCharacter()';
      UTILS.checkArgs(f, arguments, ['string', 'positiveInt', 'string']);

      var startIndex = 0;

      for (var i = 0; i < n; ++i)
      {
         var index = str.indexOf(character, startIndex);

         startIndex = index + 1;
      }

      return index;
   }

   /*
    *
    */
   function _removeNonAlphaClueCharactersFromDomAndConvertToLowerCase()
   {
      var f = 'AnagramGameTransitioner._removeNonAlphaClueCharactersFromDomAndConvertToLowerCase()';
      UTILS.checkArgs(f, arguments, []);

      var children             = _containerElementJq.children();
      var clueTextOldLowerCase = '';

      for (var i = 0, len = children.length; i < len; ++i)
      {
         var spanJq     = $(children[i]);
         var cLowerCase = spanJq.html().toLowerCase();

         if (UTILS.string.isAlpha(cLowerCase))
         {
            spanJq.html(cLowerCase);
         }
         else
         {
            spanJq.remove();
            continue;
         }

         clueTextOldLowerCase += cLowerCase;
      }

      return clueTextOldLowerCase;
   }

   /*
    *
    */
   function _removeNonAlphaCharactersFromString(str)
   {
      var f = 'AnagramGameTransitioner._removeNonAlphaCharacters(str)';
      UTILS.checkArgs(f, arguments, ['string']);

      var returnStr = '';

      for (var i = 0, len = str.length; i < len; ++i)
      {
         var c = str[i];

         if (UTILS.string.isAlpha(c))
         {
            returnStr += c;
         }
      }

      return returnStr;
   }

   // Private variables. ////////////////////////////////////////////////////////////////////////

   var _offsetByIndexByFrameNo = null;
   var _containerElementJq     = null;
   var _frameNo                = null;

   // Private constants. ////////////////////////////////////////////////////////////////////////

   var _N_FRAMES_PER_TRANSITION = 40;
   var _TRANSITION_TIME_IN_MS   = 2000;
}

/*******************************************END*OF*FILE********************************************/
