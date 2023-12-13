export const statSelect = {
	id: true,
	win: true,
	lose: true,
	draw: true,
	rank: true,
	level: true,
	xp: true,
	percentXp: true,
	Profil: true,
}

export const profilSelect = {
	id: true,
	userName: true,
	status: true,
	avatarId: true,
	stats: {select: statSelect},
	statId: true,
	matchHistory: true,
	user: false,
	userId: true,

}

export var matchSelect = {
	id: true,
	p1Score: true,
	p2Score: true,
	players:  {select: {...profilSelect, matchHistory: false}},
	player1ProfilId: true,
	mode: true,
	gaveUp: true,
	timeStamp: true

}

export const avatarSelect = {
	id: true,
	img: true,
	Profil: false,
}

export const friendSelect = {
	id: true,
	friendUserId: true,
	accepted: true,
	userId: true,
}

export const channelSelect = {
	id: true,
	conv: true,
	status: true,
	password: true,
	ownerId: true,
	adminId: true,
	memberId: true,
	invitedList: true,
	channelName: true,
	avatarId: true,
	banList: true,
	mutedList: true,
}

export const messageSelect = {
	id: true,
	senderId: true,
	content: true,
	timeStamp: true,
	channel: true,
	channelId: true,
	convId: true,
	seen: true
}

export const conversationSelect = {
	id: true,
	message: {select: messageSelect},
	userInitId: true,
	userId2: true
}


export const userSelect = {
	id: true,
	email: true,
	password: false,
	tfa: true,
	tfaSecret: true,
	friendList: {select: friendSelect},
	blockList: true,
	pendingList: true,
	profil: {select: profilSelect },
	channels: true,
	channelPendingList: true,
	convInitiator: {select: conversationSelect},
	conv: {select: conversationSelect},
	socketNumber: false,
	socketGameNumber: false,
	theme: true,
	themeColor: true
}
