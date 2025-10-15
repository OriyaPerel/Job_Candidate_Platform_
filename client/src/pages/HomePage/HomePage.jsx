import React from 'react';
import styles from './Home.module.css';
import { Link } from 'react-router-dom';



const Home = () => {
  return (
    <div className={styles.home}>
      <h1 className={styles.headline}>Welcome</h1>
    </div>
  );
};

export default Home;
