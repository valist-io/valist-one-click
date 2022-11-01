import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

const Login: NextPage = () => {
  const clientID = 'cfc893614b78b0c00a5d';

  return (
    <div className={styles.container}>
      <Head>
        <title>Valist Github One-click</title>
        <meta name="description" content="Valist Github One-click" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <a href="https://app.valist.io">Valist Github One-click Deploy</a>
        </h1>

        <p className={styles.description}>
          <a 
            style={{ color: '#0070f3', textDecoration: 'none'}} 
            href={`https://github.com/login/oauth/authorize?scope=repo&client_id=${clientID}`}
          >
            Click here
          </a> to authenticate!
        </p>

      </main>
    </div>
  );
};

export default Login;
