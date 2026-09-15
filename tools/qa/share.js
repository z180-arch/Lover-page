(function () {
  var c = window.VALENTINE_CONFIG;
  c.person.nickname = 'Mia';
  c.pageTitle = '给我最爱的 Mia';
  c.story.letters = [
    { date: '2026-09-01', title: '第一封信', content: '测试内容 <b>加粗</b> & "引号"', image: '', audio: './assets/voice/test.mp3' },
    { date: '2026-09-02', title: '第二封信', content: '第二封', image: '', audio: '' }
  ];
  c.sound.bgm = './assets/audio/bgm.mp3';
  c.photos = [{ src: './assets/photos/landscape-01.jpg', caption: '测试照片', date: '2026-09-01', place: '海边' }];
  c.metadata.template = 'night-rose';
  c.theme.colors.gradient = ['#101014', '#1a1a22', '#241f26', '#12100f'];
  c.theme.hero.rose = '';
  c.experience.chapters = [{ step: 2, id: 'quiz', label: 'A', enabled: true }];

  var link = window.ValentineConfig.generateShareLink();
  var conf = new URL(link).searchParams.get('conf');
  var back = window.ValentineConfig.resolveFromEncoded(conf);
  var payload = window.ValentineConfig.debugSharePayload();

  var check = {
    linkLen: link.length,
    diffBytes: payload.jsonBytes,
    diffKeys: payload.keys.join(','),
    roundTrip: {
      nickname: back.person.nickname,
      pageTitle: back.pageTitle,
      letters: back.story.letters.length,
      letterTitle: back.story.letters[0].title,
      letterContent: back.story.letters[0].content,
      letterAudio: back.story.letters[0].audio,
      hasAudioButtonMarkupSafe: back.story.letters[0].content.indexOf('<b>') >= 0,
      bgm: back.sound.bgm,
      photos: back.photos.length,
      photoDate: back.photos[0].date,
      photoPlace: back.photos[0].place,
      template: back.metadata.template,
      gradient: back.theme.colors.gradient.join('/'),
      chapters: JSON.stringify(back.experience.chapters)
    },
    defaultsPreserved: {
      smallThingsCount: back.smallThings.length,
      quizOptions: back.quiz.options.length,
      surprisesCount: back.surprises.length,
      fontsBody: back.theme.fonts.body,
      motionPetalCount: back.theme.motion.petalCount,
      musicEnabled: back.music.enabled
    },
    passthroughUnchanged: {
      identity: back.photos === c.photos ? 'same-ref' : 'cloned',
      homeTitle: back.home.title
    }
  };
  return JSON.stringify(check, null, 1);
})()
