import { useState, useEffect  } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import axios from "axios"
import QRCode from "react-qr-code"
import html2canvas from "html2canvas"
import './App.css'

function App() {
  const [ screenACtive, setScreenActive ] = useState( 1 )
  const [ lang, setLang ] = useState( 'en-EN' )
  const [ placeholder, setPlaceholder ] = useState( 'Speak clearly and forcefully into the microphone. When you are ready, say "Finish" and we will continue.' )
  const [ placeholderSign, setPlaceholderSign ] = useState( 'Please provide your name so we can sign your art, and say "Ok" to download your art' )
  const [ by, setBy ] = useState( 'By' )
  const [ sign, setSign ] = useState( '' )
  const [ imageKey, setImageKey ] = useState( '' )
  const [ image, setImage ] = useState()
  const [ message, setMessage ] = useState('')

  const showControls = false
  const isMuted = false
  const mapObj: { [key: string]: string } = { ok: "", Ok: "", okay: "", Okay: "" }
  const mapText: { [key: string]: string } = { terminar: "", Terminar: "", finish: "", Finish: "", fim: "", Fim: "" }
  const promptPrev = "realistic photo, modernity, red, beauty, runway model"
  const token = "cd566c9c-b287-4b7b-9df9-65e7accd692f"
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }

  const commands:any = [
    {
      command: 'reset',
      callback: () => resetTranscript( )
    },
    {
      command: 'shut up',
      callback: () => setMessage( 'I wasn\'t talking.' )
    },
    {
      command: 'Hello',
      callback: () => setScreenActive( 2 )
    },
    {
      command: 'Hola',
      callback: () => {
        setLang('es-ES')
        setPlaceholder( 'Habla con claridad y fuerza al micrófono. Cuando estés listo, di "Terminar" y continuaremos.' )
        setPlaceholderSign( 'Indique su nombre para que podamos firmar su obra y diga "Ok" para descargarla' )
        setBy( 'Por' )
        setScreenActive( 2 )
      }
    },
    {
      command: 'olá',
      callback: () => {
        setLang('pt-PT')
        setPlaceholder( 'Fale clara e vigorosamente para o microfone. Quando estiver pronto, diga "Fim" e continuaremos.' )
        setPlaceholderSign( 'Indique o seu nome para podermos assinar a sua arte e diga "Ok" para descarregar a sua arte' )
        setBy( 'Por' )
        setScreenActive( 2 )
      }
    },
    {
      command: 'Finish',
      callback: () => processPrompt( transcript )
    },
    {
      command: 'Terminar',
      callback: () => processPrompt( transcript )
    },
    {
      command: 'Fim',
      callback: () => processPrompt( transcript )
    },{
      command: 'Ok',
      callback: () => {
        processSign( transcript )
      }
    },{
      command: 'Okay',
      callback: () => {
        processSign( transcript )
      }
    }
  ]

  const {
    transcript,
    interimTranscript,
    finalTranscript,
    resetTranscript,
    listening,
  } = useSpeechRecognition({ commands })

  useEffect(() => {
    if( finalTranscript !== '' )
      console.log('Got final result:', finalTranscript)
  }, [interimTranscript, finalTranscript])

  if( !SpeechRecognition.browserSupportsSpeechRecognition() )
    return null
 
  if( !SpeechRecognition.browserSupportsSpeechRecognition() )
    console.log('Your browser does not support speech recognition software! Try Chrome desktop, maybe?')

  const listenContinuously = ( ) => {
    SpeechRecognition.startListening( { continuous: true } )
  }

  const listenContinuouslyWithLang = ( ) => {
    SpeechRecognition.startListening( { continuous: true, language: lang } )
  }

  const stopListeningContinuosly = () => {
    SpeechRecognition.stopListening()
    resetTranscript()
  }

  const processPrompt = async ( prompt:any ) => {
    let _clearText = clearText( prompt )
    stopListeningContinuosly()
    if( lang !== 'en-EN' ){
      let _textTranslate = await translationTranscript( _clearText )
      if( _textTranslate.translatedText ){
        imagine( _textTranslate.translatedText )
        setScreenActive( 5 )
      }else
        processPrompt( prompt )
    }else{
      imagine( prompt )
      setScreenActive( 5 )
    }
  }

  const processSign = ( _sign:any ) => {
    setSign( clearSign( _sign ) )
    SpeechRecognition.stopListening()
    const exportAsImage = async () => {
      const element = document.querySelector('.image-container')
      if ( element instanceof HTMLElement ) {
        const canvas = await html2canvas(element, {allowTaint: true, useCORS: true, logging: true})
        const _image = canvas.toDataURL("image/png", 1.0)
        //console.log( "URL Canvas ====> " + _image )
        // const encodedDataURL = encodeURIComponent( _image )
        // console.log( "Encode URL Canvas ====> " + encodedDataURL )
        const _heads = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
        const data = JSON.stringify({ image: _image, id: imageKey, folder:"wella" })
        axios({ method: "post", url: 'https://mocionws.info/', headers:_heads, data })
        .then((res) => console.log("SAVE IMAGE WS PHP ===> " + res) )
        .catch((error) => console.log("REQUEST IMAGE SAVE ERROR ====> " + error))
        //setFinalImage( _image )
      }else
        console.error('Element not found')
    }
    exportAsImage()
    setTimeout( () => setScreenActive( 7 ), 1000)
  }

  const clearSign = ( _sign:any ) => {
    let __clearSign = _sign.replace(/\b(?:ok|Ok|okay|Okay)\b/gi, ( matched:string ) => mapObj[matched])
    return __clearSign
  }

  const imagine = async ( prompt:any ) => {
    let msg = `${promptPrev}, ${prompt}`
    const data = JSON.stringify({ msg, ref: "", webhookOverride: "" })
    const imagineUrl = "https://api.thenextleg.io/loadBalancer/imagine"
    axios({ method: "post", url: imagineUrl, headers, data })
      .then((res) => getImage( res.data ))
      .catch((error) => setMessage("REQUEST IMAGINE API ERROR ====> " + error))
  }

  const getImage = ( MID:any ) => {
    setImageKey( MID.messageId )
    const url = `https://api.thenextleg.io/loadBalancer/message/${MID.messageId}?loadBalanceId=${MID.loadBalanceId}&expireMins=10`
    axios({ method: "get", url, headers })
      .then((response) => {
        if( response.data.response.imageUrl ){
          setMessage( "GET IMAGE RESPONSE FROM REQUEST API ===> " + response )
          let pos = getRandom( 1, 3 )
          setImage( response.data.response.imageUrls[ pos ] )
          setTimeout( () => setScreenActive( 6 ), 10000 )
        }else
          getImage( MID )
      })
      .catch((error) => {
        setMessage( "GET IMAGE ERROR FROM REQUEST API ===> " + error )
      })
  }

  const translationTranscript = async ( _text:any ) => {
    const data = JSON.stringify({
      q: _text,
      source: "auto",
      target: "en",
      api_key: "92030a7a-4226-461a-bf49-33e2e4133ec7"
    })
    const response = await axios({ method: "post", url:"https://libretranslate.com/translate", headers:{ "Content-Type": "application/json" }, data })
    .catch((error) => {
      console.log( "ERROR TRANSLATING ===> " + error )
    })
    return response?.data;
  }

  const clearText = ( _text:any ) => {
    let __clearText = _text.replace(/\b(?:terminar|Terminar|finish|Finish|fim|Fim)\b/gi, ( matchedWord:string ) => mapText[matchedWord])
    return __clearText
  }

  const getRandom = ( min:any, max:any ) => {
    const floatRandom = Math.random()
    const difference = max - min
    const random = Math.round(difference * floatRandom)
    const randomWithinRange = random + min
    return randomWithinRange
  }

  useEffect(() => {
      switch( screenACtive ){
        case 1:
          //translationTranscript( 'una mujer en una bicicleta' )
          listenContinuously()
          setMessage( `START App - on screen ( ${ screenACtive } ) - attempt to user say 'Hola, hello, olá'` )
          break;
        case 2:
          stopListeningContinuosly()
          setTimeout( () => setScreenActive( 3 ), 16000 )
          setMessage( `On screen ( ${ screenACtive } ) - Use ${lang} lang - attempt to finish video temp in 16 sec.` )
          break;
        case 3:
          setTimeout( () => setScreenActive( 4 ), 18000 )
          setMessage( `On screen ( ${ screenACtive } ) - Use ${lang} lang - explain how works A.I.` )
          break;
        case 4:
          listenContinuouslyWithLang()
          setMessage( `On screen ( ${ screenACtive } ) - Use ${lang} lang - attempt to user say prompt.` )
          break;
        case 5:
          stopListeningContinuosly()
          setMessage( `On screen ( ${ screenACtive } ) - Use ${lang} lang - attempt to generate image by A.I.` )
          break;
        case 6:
          listenContinuouslyWithLang()
          setMessage( `On screen ( ${ screenACtive } ) - Use ${lang} lang - show image generated by A.I.` )
          break;
        case 7:
          stopListeningContinuosly()
          setTimeout( () => window.location.replace('/'), 20000 )
          setMessage( `On screen ( ${ screenACtive } ) - Use ${lang} lang - show QR to download image generated by A.I.` )
          break;
      }
    }, [ screenACtive ])

  const getTranscript = () => {
    return(
      <>{transcript}<span className='caret-prompt'></span></>
    )
  }

  const getVideo = ( video:any ) => {
    return(
      <video
        autoPlay
        className={`video-${video}`}
        src={`/${video}.mp4`}
        playsInline 
        loop
        muted={ isMuted }>
      </video>
    )
  }

  const renderScreen = ( ) => {
    switch( screenACtive ){
      case 1:
        return(
          <div className={`screen ${ screenACtive === 1 && 'active' }`}>
            { getVideo( 1 ) }
            <div className='prompt-container'>
              <div className='prompt'>
                <span className='placeholder'>
                  Di "Hola" para una experiencia en Español<br/>
                  Say "Hello" for an experience in English<br/>
                  Dizer "Olá" para uma experiência portuguesa
                </span>
              </div>
            </div>
          </div>
        )
        break;
      case 2:
        return(
          <div className={`screen ${ screenACtive === 2 && 'active' }`}>
            { getVideo( 2 ) }
          </div>
        )
        break;
      case 3:
          return(
            <div className={`screen ${ screenACtive === 3 && 'active' }`}>
              { getVideo( 3 ) }
            </div>
          )
          break;
      case 4:
          return(
            <div className={`screen screen-four ${ screenACtive === 4 && 'active' }`}>
              <div className='prompt-container'>
                <div className='prompt prompt-no-bottom'>
                {transcript
                  ? getTranscript()
                  : <span className='placeholder'>{ placeholder }</span>
                }
                </div>
              </div>
            </div>
          )
        break;
      case 5:
        return(
          <div className={`screen ${ screenACtive === 5 && 'active' }`}>
            { getVideo( 1 ) }
          </div>
        )
        break;
      case 7:
        return(
          <div className={`screen screen-seven ${ screenACtive === 7 && 'active' }`}>
            <div className='qr-container'>
                <QRCode
                size={256}
                bgColor="rgba(255,255,255,0.7)"
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                value={`https://mocionws.info/download.html?url=https://mocionws.info/wella/${ imageKey }.png&name=Wella Beauty Festival - ${ sign }`}
                viewBox={`0 0 256 256`}
                />
            </div>
          </div>
        )
        break;
    }
  }

  return (
    <>
      <div className={`system ${ showControls && 'controls-active' }`}>
        {/* Controls [ START ] */}
        <div className="controls">
          <div className='transcript'>{transcript}</div>
          <button type="button" onClick={resetTranscript}>Reset</button>
          <button type="button" onClick={listenContinuously}>Listen</button>
          <button className="stop-recording" type="button" onClick={SpeechRecognition.stopListening}>Stop</button>
        </div>
        {/* Controls [ END ] */}
        <hr />
        {/* Logs [ START ] */}
        <div className='logs'>
          <b>Listening:</b><span>
            {' '}
            {listening ? 'on' : 'off'}</span><br />
          <b>Message:</b>
          <span>{' '}{message}</span>
        </div>
        {/* Logs [ END ] */}
      </div>
      <div className="container">
        {/* Screens [ START ] */}
        { screenACtive !== 6 && renderScreen() }
        <div className={`screen screen-six ${ screenACtive === 6 && 'active' }`} style={{ display: screenACtive === 6 ? 'flex' : 'none'}}>
          <div className="image-container">
            <div className="image">
              {image && <img src={image} alt="Wella Beauty Festival" />}
              <div className={`sign`}>
                {transcript
                ? `${ by } ${ clearSign( transcript ) }`
                : <span className='placeholder'>{ placeholderSign }</span>}
              </div>
            </div>
          </div>
        </div>
        {/* Screens [ END ] */}
      </div>
    </>
  )
}

export default App
