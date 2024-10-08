import { PrismaClient } from "@prisma/client/edge"
import { withAccelerate } from "@prisma/extension-accelerate"
import { Hono } from "hono"
import { decode, verify } from "hono/jwt"

export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL: string, 
        JWT_SECRET: string,
    },
    Variables: {
        userId: Number,
    }
}>()

blogRouter.use('/*', async (c, next) => {
    const header = c.req.header('Authorization');

    if (!header) {
        c.status(401)
        return c.json({ message: 'Unauthorized' });
    }

    const user = await verify(header, c.env.JWT_SECRET);

    if(user){
        c.set("userId", user.id as Number);
        console.log(c.env);
        await next();
    }
    else{
        c.status(401)
        return c.json({ message: 'Unauthorized' });
    }
})

blogRouter.post('/', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json();

    const blog = await prisma.blog.create({
        data: {
            title: body.title,
            content: body.content,
            authorId: c.get("userId") as number,
        }
    })

    return c.json(blog);
})

blogRouter.put('/', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json();

    const blog = await prisma.blog.update({
        where: {
            id: body.id
        },
        data: {
            title: body.title,
            content: body.content,
            authorId: c.get("userId") as number,
        }
    })

    return c.json(blog);
})

blogRouter.get('/bulk', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blogs = await prisma.blog.findMany();

    return c.json(blogs);
})

blogRouter.get('/:id', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const blog = await prisma.blog.findUnique({
        where: {
            id: parseInt(c.req.param('id'))
        }
    })

    return c.json(blog);
})