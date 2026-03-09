import base64
import json
import urllib.request
import sys

TOKEN = sys.argv[1] if len(sys.argv) > 1 else ""

emails = [
    {
        "label": "01-Desert Mountain HOA",
        "to": "hoa@desertmthoa.com",
        "subject": "Desert Mountain \u2014 Community Photography Request",
        "body": """Hi there,

I'm a web developer working on a luxury real estate site for a Russ Lyon Sotheby's International Realty agent who works extensively in Desert Mountain.

We're building dedicated community pages \u2014 not just listing feeds, but real profiles that give people a feel for what it's like to live there. The Taliesin-designed village concept across 32 neighborhoods and six Jack Nicklaus courses is one of the most compelling community stories in Arizona \u2014 it deserves more than a paragraph and a Google Maps screenshot.

I wanted to reach out and see if the association has any community photography you'd be open to sharing. We'd much rather showcase the real thing than cobble together low-res generic images that don't reflect the beauty and effort that's gone into your community.

Totally understand if it's not something you're able to help with \u2014 but figured it was worth asking. If there's a better person to talk to about this, I'd appreciate being pointed in the right direction.

Thanks for your time,
Joey Schnepel
Web Developer
joey@pxp.studio"""
    },
    {
        "label": "03-Estancia Community",
        "to": "estanciacommunity@cox.net",
        "subject": "Estancia \u2014 Community Photography Request",
        "body": """Hi there,

I'm a web developer working on a luxury real estate site for a Russ Lyon Sotheby's International Realty agent who works extensively in Estancia.

We're building dedicated community pages \u2014 not just listing feeds, but real profiles that give people a feel for what it's like to live there. Estancia's position on the northern slope of Pinnacle Peak, combined with the Tom Fazio course and European-style clubhouse, creates a visual identity that's completely distinct from anything else in North Scottsdale. That story deserves to be told properly.

I wanted to reach out and see if the association has any community photography you'd be open to sharing. We'd much rather showcase the real thing than cobble together low-res generic images that don't reflect the beauty and effort that's gone into your community.

Totally understand if it's not something you're able to help with \u2014 but figured it was worth asking. If there's a better person to talk to about this, I'd appreciate being pointed in the right direction.

Thanks for your time,
Joey Schnepel
Web Developer
joey@pxp.studio"""
    },
    {
        "label": "04-Estancia Club (Lori)",
        "to": "lwacaser@estanciaclub.com",
        "subject": "Estancia \u2014 Community Feature Photography",
        "body": """Hi Lori,

I'm building a luxury real estate platform for a Russ Lyon Sotheby's International Realty agent who represents buyers and sellers in Estancia.

The site includes in-depth community profiles \u2014 we want people researching the area to actually understand what makes each community different, not just see a list of homes for sale. The #1-ranked golf course in Arizona per Golf Digest, 640 acres at the base of Pinnacle Peak, and an invitation-only membership \u2014 Estancia's reputation precedes it, but many out-of-state luxury buyers researching Scottsdale have never heard of it. That's exactly the gap this platform is designed to close.

I'm reaching out to see if Estancia Club has any professional photography you'd be willing to share for the Estancia profile. We'd much rather feature real images from the community than piece together low-res generics that don't do justice to what you've built.

If this isn't something you can help with, no worries at all \u2014 and if there's someone else I should be reaching out to, I'd really appreciate a nudge in the right direction.

Thanks,
Joey Schnepel
Web Developer
joey@pxp.studio"""
    },
    {
        "label": "07-Stroll Magazine (Phil)",
        "to": "phil.johnson@n2co.com",
        "subject": "Silverleaf & DC Ranch \u2014 Community Feature Photography",
        "body": """Hi Phil,

I'm building a luxury real estate platform for a Russ Lyon Sotheby's International Realty agent who represents buyers and sellers in Silverleaf & DC Ranch.

The site includes in-depth community profiles \u2014 we want people researching the area to actually understand what makes each community different, not just see a list of homes for sale. I know Stroll connects local businesses and families in the DC Ranch and Silverleaf communities \u2014 the kind of authentic community storytelling that aligns perfectly with what we're building. I'd love to explore whether there's photography we could feature, or if you could point me toward the right contact at the community association.

I'm reaching out to see if Stroll Magazine has any professional photography you'd be willing to share for the Silverleaf & DC Ranch profile. We'd much rather feature real images from the community than piece together low-res generics that don't do justice to what you've built.

If this isn't something you can help with, no worries at all \u2014 and if there's someone else I should be reaching out to, I'd really appreciate a nudge in the right direction.

Thanks,
Joey Schnepel
Web Developer
joey@pxp.studio"""
    },
    {
        "label": "08-Troon North (Arianne)",
        "to": "arianne.ahlvin@fsresidential.com",
        "subject": "Troon North \u2014 Community Photography Request",
        "body": """Hi Arianne,

I'm a web developer working on a luxury real estate site for a Russ Lyon Sotheby's International Realty agent who works extensively in Troon North.

We're building dedicated community pages \u2014 not just listing feeds, but real profiles that give people a feel for what it's like to live there. Troon North's higher elevation \u2014 2,400 to 2,800 feet \u2014 gives it cooler temperatures and some of the most dramatic panoramic views in the Valley. The hiking and biking trails within the community boundaries are a draw that most real estate sites completely overlook.

I wanted to reach out and see if the association has any community photography you'd be open to sharing. We'd much rather showcase the real thing than cobble together low-res generic images that don't reflect the beauty and effort that's gone into your community.

Totally understand if it's not something you're able to help with \u2014 but figured it was worth asking. If there's a better person to talk to about this, I'd appreciate being pointed in the right direction.

Thanks for your time,
Joey Schnepel
Web Developer
joey@pxp.studio"""
    },
    {
        "label": "09-Troon Village (Mike)",
        "to": "mroberson@cpihoa.com",
        "subject": "Troon Village \u2014 Community Photography Request",
        "body": """Hi Mike,

I'm a web developer working on a luxury real estate site for a Russ Lyon Sotheby's International Realty agent who works extensively in Troon Village.

We're building dedicated community pages \u2014 not just listing feeds, but real profiles that give people a feel for what it's like to live there. Troon Village's 1,400 acres surrounding Troon Mountain \u2014 with Troon Country Club at its heart \u2014 represent one of Arizona's most iconic golf community landscapes. The Weiskopf/Morrish design and the mountain backdrop make for imagery that genuinely stands apart.

I wanted to reach out and see if the association has any community photography you'd be open to sharing. We'd much rather showcase the real thing than cobble together low-res generic images that don't reflect the beauty and effort that's gone into your community.

Totally understand if it's not something you're able to help with \u2014 but figured it was worth asking. If there's a better person to talk to about this, I'd appreciate being pointed in the right direction.

Thanks for your time,
Joey Schnepel
Web Developer
joey@pxp.studio"""
    },
    {
        "label": "11-Gainey Ranch CA",
        "to": "grca@gaineyranchca.com",
        "subject": "Gainey Ranch \u2014 Community Photography Request",
        "body": """Hi there,

I'm a web developer working on a luxury real estate site for a Russ Lyon Sotheby's International Realty agent who works extensively in Gainey Ranch.

We're building dedicated community pages \u2014 not just listing feeds, but real profiles that give people a feel for what it's like to live there. Gainey Ranch's palm-lined streets, the Estate Club in the original Gainey family house, and 18 distinct residential neighborhoods create a resort-like living experience in the heart of Scottsdale. It's the kind of community that photographs beautifully \u2014 and deserves to be showcased that way.

I wanted to reach out and see if the association has any community photography you'd be open to sharing. We'd much rather showcase the real thing than cobble together low-res generic images that don't reflect the beauty and effort that's gone into your community.

Totally understand if it's not something you're able to help with \u2014 but figured it was worth asking. If there's a better person to talk to about this, I'd appreciate being pointed in the right direction.

Thanks for your time,
Joey Schnepel
Web Developer
joey@pxp.studio"""
    },
    {
        "label": "12-Gainey Estate Club (Anne)",
        "to": "ablazek@gaineyranchca.com",
        "subject": "Gainey Ranch \u2014 Community Feature Photography",
        "body": """Hi Anne,

I'm building a luxury real estate platform for a Russ Lyon Sotheby's International Realty agent who represents buyers and sellers in Gainey Ranch.

The site includes in-depth community profiles \u2014 we want people researching the area to actually understand what makes each community different, not just see a list of homes for sale. The Estate Club \u2014 converted from Daniel Gainey's original ranch house \u2014 is one of the most unique community amenity stories in Arizona. I'd love to feature it prominently in the Gainey Ranch showcase alongside the broader community.

I'm reaching out to see if Gainey Ranch Estate Club has any professional photography you'd be willing to share for the Gainey Ranch profile. We'd much rather feature real images from the community than piece together low-res generics that don't do justice to what you've built.

If this isn't something you can help with, no worries at all \u2014 and if there's someone else I should be reaching out to, I'd really appreciate a nudge in the right direction.

Thanks,
Joey Schnepel
Web Developer
joey@pxp.studio"""
    },
    {
        "label": "13-AZ Biltmore NA (Rana)",
        "to": "info@azbna.com",
        "subject": "the Biltmore neighborhood \u2014 Community Photography Request",
        "body": """Hi Rana,

I'm a web developer working on a luxury real estate site for a Russ Lyon Sotheby's International Realty agent who works extensively in the Biltmore neighborhood.

We're building dedicated community pages \u2014 not just listing feeds, but real profiles that give people a feel for what it's like to live there. The Biltmore neighborhood's history \u2014 from the Frank Lloyd Wright-inspired Arizona Biltmore to the preserved residential character between 24th and 32nd Street \u2014 makes it one of Phoenix's most iconic addresses. For luxury buyers relocating from out of state, this is often the first name they recognize.

I wanted to reach out and see if the association has any community photography you'd be open to sharing. We'd much rather showcase the real thing than cobble together low-res generic images that don't reflect the beauty and effort that's gone into your community.

Totally understand if it's not something you're able to help with \u2014 but figured it was worth asking. If there's a better person to talk to about this, I'd appreciate being pointed in the right direction.

Thanks for your time,
Joey Schnepel
Web Developer
joey@pxp.studio"""
    },
    {
        "label": "15-McCormick Ranch (Jaime)",
        "to": "jaimeuhrich@mrpoa.com",
        "subject": "McCormick Ranch \u2014 Community Photography Request",
        "body": """Hi Jaime,

I'm a web developer working on a luxury real estate site for a Russ Lyon Sotheby's International Realty agent who works extensively in McCormick Ranch.

We're building dedicated community pages \u2014 not just listing feeds, but real profiles that give people a feel for what it's like to live there. Scottsdale's first premier master-planned community \u2014 10 lakes, 25 miles of multi-use paths, and a proven track record as one of the most desirable addresses in the city. McCormick Ranch's lake system alone makes for imagery that no other Scottsdale community can match.

I wanted to reach out and see if the association has any community photography you'd be open to sharing. We'd much rather showcase the real thing than cobble together low-res generic images that don't reflect the beauty and effort that's gone into your community.

Totally understand if it's not something you're able to help with \u2014 but figured it was worth asking. If there's a better person to talk to about this, I'd appreciate being pointed in the right direction.

Thanks for your time,
Joey Schnepel
Web Developer
joey@pxp.studio"""
    },
]

def send_email(token, to, subject, body):
    msg = f"From: joey@pxp.studio\r\nTo: {to}\r\nSubject: {subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n{body}"
    raw = base64.urlsafe_b64encode(msg.encode("utf-8")).decode("ascii")

    data = json.dumps({"raw": raw}).encode("utf-8")
    req = urllib.request.Request(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
            return result.get("id", "NO_ID")
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        return f"FAILED: {e.code} {err[:200]}"

for em in emails:
    msg_id = send_email(TOKEN, em["to"], em["subject"], em["body"])
    status = "SENT" if not str(msg_id).startswith("FAILED") else "FAILED"
    print(f"{status} | {em['label']} | {em['to']} | {msg_id}")
