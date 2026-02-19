import React, { useEffect, useState } from 'react';
import { endpoints } from '../api/endpoints';

export default function SocialPage() {
  const [rows, setRows] = useState([]);
  const [body, setBody] = useState('');

  const load = () => endpoints.posts().then(setRows);
  useEffect(() => { load(); }, []);

  const create = async () => {
    await endpoints.createPost({ body });
    setBody('');
    await load();
  };

  return <div><h2>Social</h2><input value={body} onChange={(e) => setBody(e.target.value)} placeholder='Share an update' /><button onClick={create}>Post</button>{rows.map((post) => <div key={post.id}><p>{post.body || post.text}</p><button onClick={async () => { await endpoints.likePost(post.id); }}>Like</button><button onClick={async () => { await endpoints.commentOnPost(post.id, 'Nice!'); }}>Comment</button><button onClick={async () => { await endpoints.sharePost(post.id); }}>Share</button><button onClick={async () => { await endpoints.reportPost(post.id, 'inappropriate'); }}>Report</button></div>)}</div>;
}
