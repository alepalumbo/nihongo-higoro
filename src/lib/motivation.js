// Short motivational phrases built from vocabulary seen in the lessons.
export const MOTIVATION = [
  { jp: '頑張って！', romaji: 'ganbatte!', it: 'Forza, dai il massimo!' },
  { jp: '毎日少しずつ。', romaji: 'mainichi sukoshi zutsu.', it: 'Ogni giorno un pochino.' },
  { jp: '日本語は楽しいです！', romaji: 'nihongo wa tanoshii desu!', it: 'Il giapponese è divertente!' },
  { jp: '今日もよく頑張りました。', romaji: 'kyou mo yoku ganbarimashita.', it: 'Anche oggi hai lavorato bene.' },
  { jp: '練習は大切です。', romaji: 'renshuu wa taisetsu desu.', it: 'La pratica è importante.' },
  { jp: '一緒に勉強しましょう！', romaji: 'issho ni benkyou shimashou!', it: 'Studiamo insieme!' },
  { jp: 'ゆっくりでいいです。', romaji: 'yukkuri de ii desu.', it: 'Va bene anche con calma.' },
  { jp: 'もっと上手になりたい！', romaji: 'motto jouzu ni naritai!', it: 'Voglio diventare ancora più bravo!' },
  { jp: '日本に行きたいです！', romaji: 'nihon ni ikitai desu!', it: 'Voglio andare in Giappone!' },
  { jp: '間違えても大丈夫。', romaji: 'machigaete mo daijoubu.', it: 'Anche se sbagli, va tutto bene.' },
  { jp: '今日は何を覚えましたか？', romaji: 'kyou wa nani wo oboemashita ka?', it: 'Cosa hai imparato oggi?' },
  { jp: '少しずつ上手になっています。', romaji: 'sukoshi zutsu jouzu ni natte imasu.', it: 'Stai migliorando poco a poco.' },
  { jp: '毎日勉強するのがいちばんです。', romaji: 'mainichi benkyou suru no ga ichiban desu.', it: 'Studiare ogni giorno è la cosa migliore.' },
  { jp: 'あきらめないで！', romaji: 'akiramenaide!', it: 'Non arrenderti!' },
  { jp: 'よくできました！', romaji: 'yoku dekimashita!', it: 'Ben fatto!' },
]

export function randomMotivation(exclude) {
  const pool = MOTIVATION.filter((m) => m !== exclude)
  return pool[Math.floor(Math.random() * pool.length)]
}
