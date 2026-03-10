/**
 * Org chart mock data — hierarchical tree of RLSIR personnel.
 */

export interface OrgPerson {
  name: string
  title: string
  role: string
  department: string
  email: string
  phone?: string
  initials: string
}

export interface OrgNodeData {
  person: OrgPerson
  children: OrgNodeData[]
}

export const ORG_TREE: OrgNodeData = {
  person: {
    name: "Todd Gillenwater",
    title: "Chief Executive Officer",
    role: "CEO",
    department: "Executive",
    email: "todd.gillenwater@rlsir.com",
    phone: "(480) 555-0100",
    initials: "TG",
  },
  children: [
    {
      person: {
        name: "Lauren Mitchell",
        title: "VP of Marketing",
        role: "VP Marketing",
        department: "Marketing",
        email: "lauren.mitchell@rlsir.com",
        phone: "(480) 555-0110",
        initials: "LM",
      },
      children: [
        {
          person: {
            name: "Lex Baum",
            title: "Marketing Manager",
            role: "Marketing Manager",
            department: "Marketing",
            email: "lex.baum@rlsir.com",
            phone: "(480) 555-0111",
            initials: "LB",
          },
          children: [
            {
              person: {
                name: "Marcus Webb",
                title: "Graphic Designer",
                role: "Designer",
                department: "Marketing",
                email: "marcus.webb@rlsir.com",
                initials: "MW",
              },
              children: [],
            },
            {
              person: {
                name: "Sophia Chen",
                title: "Content Specialist",
                role: "Content",
                department: "Marketing",
                email: "sophia.chen@rlsir.com",
                initials: "SC",
              },
              children: [],
            },
          ],
        },
        {
          person: {
            name: "Rachel Torres",
            title: "Digital Marketing Coordinator",
            role: "Digital Coordinator",
            department: "Marketing",
            email: "rachel.torres@rlsir.com",
            initials: "RT",
          },
          children: [],
        },
      ],
    },
    {
      person: {
        name: "David Harrington",
        title: "VP of Sales",
        role: "VP Sales",
        department: "Sales",
        email: "david.harrington@rlsir.com",
        phone: "(480) 555-0120",
        initials: "DH",
      },
      children: [
        {
          person: {
            name: "Karen Reeves",
            title: "Regional Sales Manager — Scottsdale",
            role: "Regional Manager",
            department: "Sales",
            email: "karen.reeves@rlsir.com",
            phone: "(480) 555-0121",
            initials: "KR",
          },
          children: [
            {
              person: {
                name: "Yong Choi",
                title: "Luxury Real Estate Advisor",
                role: "Agent",
                department: "Sales",
                email: "yong.choi@rlsir.com",
                phone: "(480) 555-0130",
                initials: "YC",
              },
              children: [],
            },
            {
              person: {
                name: "James Whitfield",
                title: "Senior Agent",
                role: "Agent",
                department: "Sales",
                email: "james.whitfield@rlsir.com",
                initials: "JW",
              },
              children: [],
            },
            {
              person: {
                name: "Natalie Brooks",
                title: "Agent",
                role: "Agent",
                department: "Sales",
                email: "natalie.brooks@rlsir.com",
                initials: "NB",
              },
              children: [],
            },
          ],
        },
        {
          person: {
            name: "Brian Caldwell",
            title: "Regional Sales Manager — Phoenix",
            role: "Regional Manager",
            department: "Sales",
            email: "brian.caldwell@rlsir.com",
            phone: "(480) 555-0125",
            initials: "BC",
          },
          children: [
            {
              person: {
                name: "Priya Sharma",
                title: "Agent",
                role: "Agent",
                department: "Sales",
                email: "priya.sharma@rlsir.com",
                initials: "PS",
              },
              children: [],
            },
            {
              person: {
                name: "Daniel Kim",
                title: "Agent",
                role: "Agent",
                department: "Sales",
                email: "daniel.kim@rlsir.com",
                initials: "DK",
              },
              children: [],
            },
          ],
        },
      ],
    },
    {
      person: {
        name: "Christine Voss",
        title: "VP of Operations",
        role: "VP Operations",
        department: "Operations",
        email: "christine.voss@rlsir.com",
        phone: "(480) 555-0140",
        initials: "CV",
      },
      children: [
        {
          person: {
            name: "Michael Santos",
            title: "Transaction Coordinator Lead",
            role: "TC Lead",
            department: "Operations",
            email: "michael.santos@rlsir.com",
            initials: "MS",
          },
          children: [
            {
              person: {
                name: "Ashley Morgan",
                title: "Transaction Coordinator",
                role: "TC",
                department: "Operations",
                email: "ashley.morgan@rlsir.com",
                initials: "AM",
              },
              children: [],
            },
          ],
        },
        {
          person: {
            name: "Ryan Park",
            title: "IT Administrator",
            role: "IT Admin",
            department: "Operations",
            email: "ryan.park@rlsir.com",
            initials: "RP",
          },
          children: [],
        },
      ],
    },
  ],
}
