import axios from 'axios';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import { Octokit } from "@octokit/core";
import { Button, Center, Group, Select, Text, Textarea, TextInput } from '@mantine/core';
import { addSecret, createPullRequest, buildYaml, getRepos } from '../utils/github';

const Home: NextPage = () => {
  const router = useRouter();
  const { code } = router.query;
  const [token, setToken] = useState<string>('');
  const [client, setClient]= useState<Octokit | null>();
  const [valistConfig, setValistConfig] = useState<string>(buildYaml());
  const [userRepos, setUserRepos] = useState<string[]>([]);

  console.log('account, repo', valistConfig);

  const splitName = (name: string) => {
    const names = name?.split('/');
    if(names?.length === 2) {
      setValistConfig(buildYaml(names[0], names[1]));
    };
  };

  useEffect(() => {
    if (code && code.length > 4) {
      try {
        axios.get(`/api/hello?code=${code}`).then((data) =>{
          setToken(String(data?.data));
        });
      } catch(err) {
        router.push('/login');
      }
    };
  },[code]);

  useEffect(() => {
    const _token = token.split('&')[0];
    console.log('token', _token);

    if (token.includes('bad_verification_code')) {
      router.push('/login');
    } else {
      const octokit = new Octokit({ auth: _token });
      setClient(octokit);
    }
  },[token]);

  useEffect(() => {
    if (client && token) {
      getRepos(client).then((repos) => {
        const names = repos?.data?.map((repo) => {
          return repo.full_name;
        });
       setUserRepos(names);
       if (names.length !== 0) {
        splitName(names[0]);
       }
      });
    };
  }, [client]);

  const makeRequest = () => {
    (async () => {
      if (client) {
       await createPullRequest(client, valistConfig);
      };
    })();
  };

  const createKey = () => {
    (async () => {
      if (client) {
       await addSecret(client);
      };
    })();
  };

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

        {userRepos.length !== 0 &&
          <>
            <Group style={{margin: "40px 0"}}>
              <Select
                label="Repository" 
                data={userRepos}
                onChange={(value) => { if (value) splitName(value)}}
              />
              <Select 
                label="Project Type"
                data={['NextJS',]}
              />
            </Group>

            <Textarea
              label="Github Action Workflow Preview"
              value={valistConfig}
              style={{width: 500}}
              disabled
              size="xl"
              minRows={13}
              required
            />

            <br/>
            <Group>
              <Button onClick={makeRequest}>Create Pull Request</Button>
              <Button onClick={createKey}>Add New Signer Key</Button>
            </Group>
          </>
        }
        {userRepos.length === 0 &&
          <Center>
            <Text style={{fontSize: 65, margin: '20px 0', fontWeight: '100'}}>
              Loading User Data
            </Text>
          </Center>
        }
      </main>
    </div>
  );
};

export default Home;
