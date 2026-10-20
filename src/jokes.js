// Gen-Z, deadpan, situational — dev/student life. Shuffle-bag so nothing repeats until all are used.
export const JOKES = [
  "my code works on my machine. my machine is also the only witness. no further questions.",
  "i don't have imposter syndrome. i have a github with 4 commits at 3am and a very accurate self-assessment.",
  "group project update: i have now done 'a little bit of everyone's part' and i'm calm about it. i'm calm.",
  "the deadline is tonight so naturally i'm reorganizing my vs code theme. priorities.",
  "'quick fix' is the most dangerous phrase in tech. second place is 'it's a small change.'",
  "me: i'll write the docs later. also me, 6 months later, staring at my own code like it's a stranger's diary.",
  "stack overflow said 'this question is a duplicate.' bestie it was a different duplicate.",
  "i named a variable 'temp' in march. it is now october. temp is load-bearing.",
  "there are two kinds of devs: those who test in production and those who also test in production but lie about it.",
  "my sleep schedule and my commit history are the same graph and neither is healthy.",
  "recruiter: 'we're like a family here.' me, who has seen a family group chat: so... chaotic and someone's mad at me?",
  "every 'just add a button' request is a tiny horror movie with a backend.",
  "i said 'it's fine' about the merge conflict. it was not fine. it is still not fine.",
  "ai wrote the code, i wrote the prompt, the bug wrote itself. true collaboration.",
  "'works on localhost' is a love language and also a lie.",
  "my todo list has a todo that says 'organize todo list'. it has been there since freshman year.",
  "git blame said it was me. i said that's a different me. that me had no sleep.",
  "when the wifi dies mid-deploy and you realize you've been taking 'cloud' very literally.",
  "professor: 'it's easy, really.' the class, collectively: *opens 14 tabs of regret*",
  "i don't ghost people, i just have 47 unread messages and a very dramatic sense of timing.",
  "debugging is just being a detective in a crime movie where you're also the murderer.",
  "the 'final_final_v3_REAL.docx' energy is exactly how my branches are named.",
  "a meeting that could've been an email, hosted by a person who could've been a calendar invite.",
  "me explaining my project to my relatives: 'so it's like... the internet but it does a thing.' they nod. they're proud. nobody knows.",
  "console.log('here') is my entire observability stack and i'm thriving.",
  "i set 5 alarms to wake up and a 6th to apologize to the first five.",
  "'we'll circle back' means the topic has been placed in a very polite grave.",
  "someone asked if i'm a morning person. i'm a 'technically it's still night' person.",
  "my battery is at 3% and so is my motivation, but only one of them has a charger.",
  "reading old code: 'who wrote this?' git blame: 'you.' me: 'ok but with what authority.'",
  "told my friend i'd 'look into it.' looked into it. it's a pit. there are bats.",
  "internship hunting is just sending 'hello i exist' emails into the void and the void sends back 'we've decided to move forward with other candidates' in a nice font.",
  "pov: your code compiles on the first try and you immediately know something is wrong.",
  "naming things is hard. naming things at 2am is a crime scene.",
  "'it's not a bug, it's a feature' — me, 4 minutes before the demo, to nobody who asked.",
  "my screen time report called me out in front of everyone. it was a public humbling.",
  "i love a clean codebase the way i love a clean room: from afar, and in theory.",
  "plot twist: the thing i was overengineering would've been done in 10 minutes. the plot is always this twist.",
  "that feeling when you fix one bug and the page just quietly makes two new friends.",
  "'i'll sleep after this commit' — famous last words, volume 1 through 900.",
  "the gc is 'quiet' because everyone is secretly working on the same file. we will meet in the merge conflict.",
  "not me turning a 3-step manual task into a 3-week automation project. the ROI is emotional.",
  "hot take: the real senior skill is saying 'let me get back to you' with a straight face.",
  "if i had a peso for every time i said 'last one, i promise' about a feature, i could finally afford the cloud bill.",
];

let bag = [];
export function nextJoke() {
  if (!bag.length) {
    bag = JOKES.map((_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }
  return JOKES[bag.pop()];
}
