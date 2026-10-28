export const pangea_structure = {
	company: 'Pangea World Theater',
	location: 'Minneapolis, MN',
	dates: [
		{
			start: '1995-01-01',
			end: new Date().toISOString()
		}
	],
	departments: [
		{
			id: 'productions',
			name: 'Productions',
			active: true
		},
		{
			id: 'education',
			name: 'Education',
			active: true,
			programs: [
				{
					id: 'mea-camp',
					name: 'MEA Camps',
					active: true
				}
			]
		},
		{
			id: 'lake-st-arts',
			name: 'Lake Street Arts',
			active: true,
			programs: [
				{
					id: 'seeding-change',
					name: 'Seeding Change Institute',
					active: true,
					dates: [
						{
							start: '2020-01-01',
							end: new Date().toISOString()
						}
					]
				},
				{
					id: 'poetry-in-the-windows',
					name: 'Poetry in the Windows',
					active: true,
					dates: [
						{
							start: '2020-01-01',
							end: new Date().toISOString()
						}
					]
				},
				{
					id: 'milkweed-maps',
					name: 'Milkweed Maps',
                    active: true,
					dates: [
						{
							start: '2020-01-01',
							end: new Date().toISOString()
						}
					]
				}
			]
		}
	],

	collaborative_projects: [
		{
			id: 'lake-st-alignment',
			name: 'Lake Street Alignment',
			active: true
		},
		{
			id: 'nidec',
			name: 'NIDEC',
            active: true, 
            collaborators: [
                {
                    id: 'art-2-action',
                    name: 'Art2Action',
                }
            ]
		},
		{
			id: 'liberating-spaces',
			name: 'Liberating Spaces',
            active: true, 
            collaborators: [
                {
			id: 'lake-st-alignment',
			name: 'Lake Street Alignment',
		}
            ]
		}
	],
	collaborators: [
		{
			id: 'iptf',
			name: 'Indigenous Peoples Task Force',
			active: true
		},
		{
			id: 'art-2-action',
			name: 'Art2Action',
			active: true
		},
		{
			id: 'carleton-college',
			name: 'Carleton College',
			active: true
		},
		{
			id: 'lake-st-council',
			name: 'Lake Street Council',
			active: true
		}
    ]
};

export const tctocc_structure = [
	{
		theater_name: 'Pangea World Theater',
		demographic_served: 'Decolonized',
		date_joined: '2021',
		programming: '?'
	},
	{
		theater_name: 'Teatro del Pueblo',
		demographic_served: 'Latinx',
		date_joined: '2021',
		programming: '?'
	},
	{
		theater_name: 'New Native Theater',
		demographic_served: 'Indigenous',
		date_joined: '2021',
		programming: '?'
	},
	{
		theater_name: 'Penumbra Theatre',
		demographic_served: 'Black / African American',
		date_joined: '2021',
		programming: '?'
	},
	{
		theater_name: 'Theater Mu',
		demographic_served: 'Asian American',
		date_joined: '2021',
		programming: '?'
	}
];