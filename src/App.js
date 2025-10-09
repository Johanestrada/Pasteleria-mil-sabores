import logo from './logo.svg';
import './App.css';
import { UserProvider } from './context/UserContext';

function App() {
  return(
    <UserProvider>
      <Router>
        <RouterConfig/>
      </Router>
    </UserProvider>

  );
}

export default App;
