import './App.css'
import AppPage from './components/AppPage'
import * as buffer from "buffer";
window.Buffer = buffer.Buffer;
function App() {

  return (
    <>
      <AppPage />
      {/* <Hero />
      <Tokenomics />
      <Faqs /> */}
    </>
  )
}

export default App
